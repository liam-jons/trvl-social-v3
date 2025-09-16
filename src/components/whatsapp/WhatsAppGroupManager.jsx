import React, { useState, useEffect } from 'react';
import { PhoneIcon, UsersIcon, ChatBubbleLeftRightIcon, CheckCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { supabase } from '../../lib/supabase';
import useAuthStore from '../../stores/authStore';
import { toast } from 'react-hot-toast';
/**
 * WhatsApp Group Manager Component
 * Handles WhatsApp group creation and management for travel adventures
 */
export default function WhatsAppGroupManager({ adventureId, adventureTitle, onGroupCreated }) {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [groups, setGroups] = useState([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    adminPhoneNumber: '',
    members: []
  });
  const [memberInput, setMemberInput] = useState({ name: '', phone: '' });
  useEffect(() => {
    if (adventureId) {
      loadExistingGroups();
    }
  }, [adventureId]);
  /**
   * Load existing WhatsApp groups for the adventure
   */
  const loadExistingGroups = async () => {
    try {
      const { data, error } = await supabase
        .from('whatsapp_groups')
        .select('*')
        .eq('adventure_id', adventureId)
        .eq('admin_user_id', user.id)
        .neq('status', 'deleted')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setGroups(data || []);
    } catch (error) {
      console.error('Error loading WhatsApp groups:', error);
      toast.error('Failed to load WhatsApp groups');
    }
  };
  /**
   * Handle form input changes
   */
  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };
  /**
   * Add member to the group
   */
  const addMember = () => {
    if (!memberInput.name.trim() || !memberInput.phone.trim()) {
      toast.error('Please enter both name and phone number');
      return;
    }
    // Basic phone number validation
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    if (!phoneRegex.test(memberInput.phone.replace(/\s/g, ''))) {
      toast.error('Please enter a valid phone number');
      return;
    }
    const newMember = {
      id: Date.now(),
      name: memberInput.name.trim(),
      phone: memberInput.phone.replace(/\s/g, '').startsWith('+')
        ? memberInput.phone.replace(/\s/g, '')
        : `+${memberInput.phone.replace(/\s/g, '')}`
    };
    setFormData(prev => ({
      ...prev,
      members: [...prev.members, newMember]
    }));
    setMemberInput({ name: '', phone: '' });
  };
  /**
   * Remove member from the group
   */
  const removeMember = (memberId) => {
    setFormData(prev => ({
      ...prev,
      members: prev.members.filter(member => member.id !== memberId)
    }));
  };
  /**
   * Create WhatsApp group
   */
  const createGroup = async () => {
    if (!formData.name.trim()) {
      toast.error('Group name is required');
      return;
    }
    if (!formData.adminPhoneNumber.trim()) {
      toast.error('Admin phone number is required');
      return;
    }
    setLoading(true);
    try {
      const response = await fetch('/api/whatsapp/groups', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.access_token || (await supabase.auth.getSession()).data.session?.access_token}`
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          description: formData.description.trim(),
          adventureId,
          members: formData.members,
          adminPhoneNumber: formData.adminPhoneNumber.trim()
        })
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create WhatsApp group');
      }
      const result = await response.json();
      toast.success('WhatsApp group created! Check your phone for setup instructions.');
      // Reset form
      setFormData({
        name: '',
        description: '',
        adminPhoneNumber: '',
        members: []
      });
      setShowCreateForm(false);
      // Reload groups
      await loadExistingGroups();
      // Notify parent component
      if (onGroupCreated) {
        onGroupCreated(result.group);
      }
    } catch (error) {
      console.error('Error creating WhatsApp group:', error);
      toast.error(error.message || 'Failed to create WhatsApp group');
    } finally {
      setLoading(false);
    }
  };
  /**
   * Update group with invitation link
   */
  const updateGroupLink = async (groupId, invitationLink) => {
    if (!invitationLink.trim()) {
      toast.error('Invitation link is required');
      return;
    }
    try {
      const response = await fetch(`/api/whatsapp/groups?groupId=${groupId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.access_token || (await supabase.auth.getSession()).data.session?.access_token}`
        },
        body: JSON.stringify({
          invitation_link: invitationLink.trim(),
          status: 'active'
        })
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update group');
      }
      toast.success('Group updated successfully! Invitations will be sent.');
      await loadExistingGroups();
    } catch (error) {
      console.error('Error updating group:', error);
      toast.error(error.message || 'Failed to update group');
    }
  };
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-gray-900">
            WhatsApp Groups
          </h3>
          <p className="text-sm text-gray-500">
            Create and manage WhatsApp groups for {adventureTitle}
          </p>
        </div>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
        >
          <ChatBubbleLeftRightIcon className="h-4 w-4 mr-2" />
          Create Group
        </button>
      </div>
      {/* Existing Groups */}
      {groups.length > 0 && (
        <div className="space-y-4">
          <h4 className="text-md font-medium text-gray-900">Existing Groups</h4>
          <div className="grid gap-4">
            {groups.map((group) => (
              <GroupCard
                key={group.id}
                group={group}
                onUpdateLink={updateGroupLink}
                onReload={loadExistingGroups}
              />
            ))}
          </div>
        </div>
      )}
      {/* Create Group Form */}
      {showCreateForm && (
        <div className="border border-gray-200 rounded-lg p-6 space-y-4">
          <h4 className="text-md font-medium text-gray-900">Create New WhatsApp Group</h4>
          {/* Group Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Group Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder={`${adventureTitle} - Adventure Group`}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Share trip details, photos, and coordinate your adventure!"
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
          {/* Admin Phone Number */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Your Phone Number (Group Admin) *
            </label>
            <div className="relative">
              <PhoneIcon className="h-5 w-5 text-gray-400 absolute left-3 top-2.5" />
              <input
                type="tel"
                value={formData.adminPhoneNumber}
                onChange={(e) => handleInputChange('adminPhoneNumber', e.target.value)}
                placeholder="+1234567890"
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
          </div>
          {/* Members */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Group Members
            </label>
            {/* Add Member Form */}
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={memberInput.name}
                onChange={(e) => setMemberInput(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Member name"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
              <input
                type="tel"
                value={memberInput.phone}
                onChange={(e) => setMemberInput(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="+1234567890"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
              <button
                onClick={addMember}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                Add
              </button>
            </div>
            {/* Members List */}
            {formData.members.length > 0 && (
              <div className="space-y-2">
                {formData.members.map((member) => (
                  <div key={member.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-md">
                    <div className="flex items-center">
                      <UsersIcon className="h-4 w-4 text-gray-400 mr-2" />
                      <span className="text-sm font-medium text-gray-900">{member.name}</span>
                      <span className="text-sm text-gray-500 ml-2">{member.phone}</span>
                    </div>
                    <button
                      onClick={() => removeMember(member.id)}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <button
              onClick={() => setShowCreateForm(false)}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              Cancel
            </button>
            <button
              onClick={createGroup}
              disabled={loading}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating...' : 'Create Group'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
/**
 * Individual Group Card Component
 */
function GroupCard({ group, onUpdateLink, onReload }) {
  const [showLinkForm, setShowLinkForm] = useState(false);
  const [invitationLink, setInvitationLink] = useState('');
  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-100';
      case 'pending_creation': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };
  const getStatusText = (status) => {
    switch (status) {
      case 'active': return 'Active';
      case 'pending_creation': return 'Pending Setup';
      default: return status.replace('_', ' ').toUpperCase();
    }
  };
  const handleUpdateLink = async () => {
    if (!invitationLink.trim()) return;
    await onUpdateLink(group.id, invitationLink);
    setInvitationLink('');
    setShowLinkForm(false);
  };
  return (
    <div className="border border-gray-200 rounded-lg p-4 space-y-3">
      <div className="flex items-start justify-between">
        <div>
          <h5 className="font-medium text-gray-900">{group.name}</h5>
          {group.description && (
            <p className="text-sm text-gray-600 mt-1">{group.description}</p>
          )}
        </div>
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(group.status)}`}>
          {getStatusText(group.status)}
        </span>
      </div>
      <div className="flex items-center text-sm text-gray-500">
        <UsersIcon className="h-4 w-4 mr-1" />
        <span>{group.members?.length || 0} members</span>
        <PhoneIcon className="h-4 w-4 ml-4 mr-1" />
        <span>{group.admin_phone_number}</span>
      </div>
      {group.status === 'pending_creation' && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
          <div className="flex">
            <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600 mr-2" />
            <div className="text-sm">
              <p className="text-yellow-800 font-medium">Setup Required</p>
              <p className="text-yellow-700 mt-1">
                Create the WhatsApp group manually, then add the invitation link below.
              </p>
            </div>
          </div>
          {!showLinkForm ? (
            <button
              onClick={() => setShowLinkForm(true)}
              className="mt-3 text-sm text-yellow-800 hover:text-yellow-900 font-medium"
            >
              Add Invitation Link
            </button>
          ) : (
            <div className="mt-3 flex gap-2">
              <input
                type="url"
                value={invitationLink}
                onChange={(e) => setInvitationLink(e.target.value)}
                placeholder="https://chat.whatsapp.com/..."
                className="flex-1 px-2 py-1 text-sm border border-yellow-300 rounded focus:outline-none focus:ring-2 focus:ring-yellow-500"
              />
              <button
                onClick={handleUpdateLink}
                className="px-3 py-1 text-sm bg-yellow-600 text-white rounded hover:bg-yellow-700"
              >
                Save
              </button>
              <button
                onClick={() => setShowLinkForm(false)}
                className="px-3 py-1 text-sm border border-yellow-300 rounded hover:bg-yellow-50"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      )}
      {group.status === 'active' && group.invitation_link && (
        <div className="bg-green-50 border border-green-200 rounded-md p-3">
          <div className="flex items-center">
            <CheckCircleIcon className="h-5 w-5 text-green-600 mr-2" />
            <div className="text-sm">
              <p className="text-green-800 font-medium">Group Active</p>
              <p className="text-green-700">
                All members have been invited to join the WhatsApp group.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}