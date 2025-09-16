import whatsAppService from '../../src/services/whatsapp-service.js';
import { supabase } from '../../src/lib/supabase.js';

/**
 * WhatsApp group management API endpoint
 */
export default async function handler(req, res) {
  // Only allow authenticated requests
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const token = authHeader.replace('Bearer ', '');

  try {
    // Verify the user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    // Handle different HTTP methods
    switch (req.method) {
      case 'POST':
        return await handleCreateGroup(req, res, user);
      case 'PUT':
        return await handleUpdateGroup(req, res, user);
      case 'GET':
        return await handleGetGroups(req, res, user);
      case 'DELETE':
        return await handleDeleteGroup(req, res, user);
      default:
        res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Error in WhatsApp groups API:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Create a new WhatsApp group for a travel adventure
 */
async function handleCreateGroup(req, res, user) {
  try {
    const {
      name,
      description,
      adventureId,
      members,
      adminPhoneNumber
    } = req.body;

    // Validate required fields
    if (!name || !adventureId || !adminPhoneNumber) {
      return res.status(400).json({
        error: 'Missing required fields: name, adventureId, adminPhoneNumber'
      });
    }

    // Verify user has permission to create group for this adventure
    const { data: adventure, error: adventureError } = await supabase
      .from('adventures')
      .select('*, vendor_id')
      .eq('id', adventureId)
      .single();

    if (adventureError || !adventure) {
      return res.status(404).json({ error: 'Adventure not found' });
    }

    // Check if user is the vendor or has permission
    const { data: vendorProfile } = await supabase
      .from('vendor_profiles')
      .select('user_id')
      .eq('id', adventure.vendor_id)
      .single();

    if (vendorProfile?.user_id !== user.id) {
      return res.status(403).json({ error: 'Permission denied' });
    }

    // Create WhatsApp group
    const groupResult = await whatsAppService.createGroup({
      name,
      description,
      members: members || [],
      adminPhoneNumber
    });

    if (!groupResult.success) {
      return res.status(400).json({
        error: 'Failed to create WhatsApp group',
        details: groupResult.error
      });
    }

    // Store group information in database
    const { data: whatsappGroup, error: dbError } = await supabase
      .from('whatsapp_groups')
      .insert({
        id: groupResult.groupInfo.id,
        adventure_id: adventureId,
        name: name,
        description: description,
        admin_user_id: user.id,
        admin_phone_number: adminPhoneNumber,
        members: members || [],
        status: 'pending_creation',
        created_by: user.id,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (dbError) {
      console.error('Error storing WhatsApp group:', dbError);
      return res.status(500).json({ error: 'Failed to store group information' });
    }

    // If members provided, send invitations
    let invitationResults = null;
    if (members && members.length > 0) {
      invitationResults = await whatsAppService.inviteToGroup(
        groupResult.groupInfo,
        members
      );
    }

    return res.status(201).json({
      status: 'success',
      group: whatsappGroup,
      whatsappResponse: groupResult,
      invitations: invitationResults
    });
  } catch (error) {
    console.error('Error creating WhatsApp group:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Update WhatsApp group information
 */
async function handleUpdateGroup(req, res, user) {
  try {
    const { groupId } = req.query;
    const { invitation_link, status, members } = req.body;

    if (!groupId) {
      return res.status(400).json({ error: 'Group ID is required' });
    }

    // Get existing group
    const { data: existingGroup, error: groupError } = await supabase
      .from('whatsapp_groups')
      .select('*')
      .eq('id', groupId)
      .eq('admin_user_id', user.id)
      .single();

    if (groupError || !existingGroup) {
      return res.status(404).json({ error: 'Group not found or access denied' });
    }

    // Update group
    const updates = {};
    if (invitation_link) updates.invitation_link = invitation_link;
    if (status) updates.status = status;
    if (members) updates.members = members;
    if (Object.keys(updates).length > 0) {
      updates.updated_at = new Date().toISOString();
    }

    const { data: updatedGroup, error: updateError } = await supabase
      .from('whatsapp_groups')
      .update(updates)
      .eq('id', groupId)
      .select()
      .single();

    if (updateError) {
      return res.status(500).json({ error: 'Failed to update group' });
    }

    // If invitation link was added and group is now active, send invitations to pending members
    if (invitation_link && status === 'active' && members && members.length > 0) {
      const groupInfo = {
        ...existingGroup,
        invitation_link
      };

      const invitationResults = await whatsAppService.inviteToGroup(
        groupInfo,
        members
      );

      return res.status(200).json({
        status: 'success',
        group: updatedGroup,
        invitations: invitationResults
      });
    }

    return res.status(200).json({
      status: 'success',
      group: updatedGroup
    });
  } catch (error) {
    console.error('Error updating WhatsApp group:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Get user's WhatsApp groups
 */
async function handleGetGroups(req, res, user) {
  try {
    const { adventureId } = req.query;

    let query = supabase
      .from('whatsapp_groups')
      .select(`
        *,
        adventures (
          id,
          title,
          location,
          date
        )
      `)
      .eq('admin_user_id', user.id)
      .order('created_at', { ascending: false });

    if (adventureId) {
      query = query.eq('adventure_id', adventureId);
    }

    const { data: groups, error } = await query;

    if (error) {
      return res.status(500).json({ error: 'Failed to fetch groups' });
    }

    return res.status(200).json({
      status: 'success',
      groups: groups || []
    });
  } catch (error) {
    console.error('Error fetching WhatsApp groups:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Delete WhatsApp group
 */
async function handleDeleteGroup(req, res, user) {
  try {
    const { groupId } = req.query;

    if (!groupId) {
      return res.status(400).json({ error: 'Group ID is required' });
    }

    // Verify ownership
    const { data: existingGroup, error: groupError } = await supabase
      .from('whatsapp_groups')
      .select('*')
      .eq('id', groupId)
      .eq('admin_user_id', user.id)
      .single();

    if (groupError || !existingGroup) {
      return res.status(404).json({ error: 'Group not found or access denied' });
    }

    // Mark as deleted (soft delete)
    const { error: deleteError } = await supabase
      .from('whatsapp_groups')
      .update({
        status: 'deleted',
        deleted_at: new Date().toISOString()
      })
      .eq('id', groupId);

    if (deleteError) {
      return res.status(500).json({ error: 'Failed to delete group' });
    }

    return res.status(200).json({
      status: 'success',
      message: 'Group deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting WhatsApp group:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}