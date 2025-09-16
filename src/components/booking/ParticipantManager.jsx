/**
 * ParticipantManager - Component for adding/removing/managing group participants
 * Handles participant validation, invitation links, and user search
 */

import React, { useState, useEffect } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { GlassInput } from '../ui/GlassInput';
import { supabase } from '../../lib/supabase';
import { UserPlus, UserMinus, Mail, User, AlertCircle } from 'lucide-react';

const ParticipantManager = ({
  participants = [],
  onParticipantsChange,
  currentUserId,
  disabled = false,
  maxParticipants = 20,
  showCurrentUser = true
}) => {
  const [searchEmail, setSearchEmail] = useState('');
  const [searchName, setSearchName] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [error, setError] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});

  // Search for users by email
  const searchUsers = async (email) => {
    if (!email || email.length < 3) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, email, first_name, last_name, profile_picture_url')
        .ilike('email', `%${email}%`)
        .limit(10);

      if (error) throw error;

      // Filter out current user and already added participants
      const filteredResults = data.filter(user =>
        user.id !== currentUserId &&
        !participants.some(p => p.id === user.id || p.email === user.email)
      );

      setSearchResults(filteredResults);
    } catch (err) {
      setError(`Search failed: ${err.message}`);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      searchUsers(searchEmail);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchEmail]);

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateParticipant = (participant) => {
    const errors = {};

    if (!participant.name || participant.name.trim().length < 2) {
      errors.name = 'Name must be at least 2 characters';
    }

    if (!participant.email) {
      errors.email = 'Email is required';
    } else if (!validateEmail(participant.email)) {
      errors.email = 'Invalid email format';
    }

    // Check for duplicates
    const existingParticipant = participants.find(p =>
      p.email === participant.email || (p.id && p.id === participant.id)
    );
    if (existingParticipant) {
      errors.email = 'This person is already added';
    }

    return errors;
  };

  const addParticipantFromSearch = (user) => {
    const participant = {
      id: user.id,
      name: `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email,
      email: user.email,
      profilePicture: user.profile_picture_url,
      isRegistered: true,
    };

    const errors = validateParticipant(participant);
    if (Object.keys(errors).length === 0) {
      onParticipantsChange([...participants, participant]);
      setSearchEmail('');
      setSearchResults([]);
      setError(null);
    } else {
      setValidationErrors(errors);
    }
  };

  const addParticipantManually = () => {
    if (!searchEmail || !searchName) {
      setError('Both name and email are required');
      return;
    }

    const participant = {
      id: null, // No user ID for non-registered users
      name: searchName.trim(),
      email: searchEmail.trim().toLowerCase(),
      profilePicture: null,
      isRegistered: false,
    };

    const errors = validateParticipant(participant);
    if (Object.keys(errors).length === 0) {
      onParticipantsChange([...participants, participant]);
      setSearchEmail('');
      setSearchName('');
      setError(null);
      setValidationErrors({});
    } else {
      setValidationErrors(errors);
    }
  };

  const removeParticipant = (index) => {
    const newParticipants = participants.filter((_, i) => i !== index);
    onParticipantsChange(newParticipants);
  };

  const canAddMore = participants.length < maxParticipants;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h4 className="text-md font-medium">Manage Participants</h4>
        <Badge variant="outline">
          {participants.length} / {maxParticipants} members
        </Badge>
      </div>

      {/* Current Participants */}
      {participants.length > 0 && (
        <Card className="p-4">
          <h5 className="text-sm font-medium mb-3">Current Participants</h5>
          <div className="space-y-2">
            {participants.map((participant, index) => (
              <div
                key={`${participant.id || participant.email}-${index}`}
                className="flex items-center justify-between p-3 bg-muted rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                    {participant.profilePicture ? (
                      <img
                        src={participant.profilePicture}
                        alt={participant.name}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    ) : (
                      <User className="w-4 h-4" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{participant.name}</p>
                    <p className="text-xs text-muted-foreground flex items-center">
                      <Mail className="w-3 h-3 mr-1" />
                      {participant.email}
                      {!participant.isRegistered && (
                        <Badge variant="outline" className="ml-2 text-xs">
                          Invite Required
                        </Badge>
                      )}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeParticipant(index)}
                  disabled={disabled}
                  className="text-destructive hover:text-destructive"
                >
                  <UserMinus className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Add Participants */}
      {canAddMore && !disabled && (
        <Card className="p-4">
          <h5 className="text-sm font-medium mb-3">Add Participants</h5>

          <div className="space-y-4">
            {/* Email Search */}
            <div>
              <label className="text-xs font-medium text-muted-foreground">
                Search by Email
              </label>
              <GlassInput
                type="email"
                placeholder="Enter email address..."
                value={searchEmail}
                onChange={(e) => setSearchEmail(e.target.value)}
                className={validationErrors.email ? 'border-destructive' : ''}
              />
              {validationErrors.email && (
                <p className="text-xs text-destructive mt-1 flex items-center">
                  <AlertCircle className="w-3 h-3 mr-1" />
                  {validationErrors.email}
                </p>
              )}
            </div>

            {/* Search Results */}
            {searchResults.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">
                  Found Users:
                </p>
                {searchResults.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-2 border rounded-lg hover:bg-muted/50"
                  >
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center">
                        {user.profile_picture_url ? (
                          <img
                            src={user.profile_picture_url}
                            alt={user.first_name}
                            className="w-6 h-6 rounded-full object-cover"
                          />
                        ) : (
                          <User className="w-3 h-3" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium">
                          {user.first_name} {user.last_name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {user.email}
                        </p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => addParticipantFromSearch(user)}
                    >
                      <UserPlus className="w-3 h-3 mr-1" />
                      Add
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {/* Manual Add for Non-Registered Users */}
            {searchEmail && searchResults.length === 0 && !isSearching && (
              <div className="space-y-3 p-3 border rounded-lg bg-muted/30">
                <p className="text-sm font-medium">Add as Guest</p>
                <p className="text-xs text-muted-foreground">
                  User not found. Add as guest participant (they'll receive a payment link via email).
                </p>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">
                    Full Name
                  </label>
                  <GlassInput
                    type="text"
                    placeholder="Enter full name..."
                    value={searchName}
                    onChange={(e) => setSearchName(e.target.value)}
                    className={validationErrors.name ? 'border-destructive' : ''}
                  />
                  {validationErrors.name && (
                    <p className="text-xs text-destructive mt-1 flex items-center">
                      <AlertCircle className="w-3 h-3 mr-1" />
                      {validationErrors.name}
                    </p>
                  )}
                </div>
                <Button
                  size="sm"
                  onClick={addParticipantManually}
                  disabled={!searchName || !searchEmail}
                >
                  <UserPlus className="w-3 h-3 mr-1" />
                  Add as Guest
                </Button>
              </div>
            )}

            {isSearching && (
              <div className="flex items-center justify-center p-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                <span className="ml-2 text-sm text-muted-foreground">Searching...</span>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Error Display */}
      {error && (
        <Card className="p-3 border-destructive">
          <p className="text-sm text-destructive flex items-center">
            <AlertCircle className="w-4 h-4 mr-2" />
            {error}
          </p>
        </Card>
      )}

      {/* Limits */}
      {!canAddMore && (
        <Card className="p-3 border-amber-200 bg-amber-50">
          <p className="text-sm text-amber-700 flex items-center">
            <AlertCircle className="w-4 h-4 mr-2" />
            Maximum number of participants ({maxParticipants}) reached.
          </p>
        </Card>
      )}

      {/* Instructions */}
      {participants.length === 0 && (
        <Card className="p-4 bg-muted/30">
          <h5 className="text-sm font-medium mb-2">Getting Started</h5>
          <ul className="text-xs text-muted-foreground space-y-1">
            <li>• Search for registered users by email</li>
            <li>• Add guests who will receive payment links via email</li>
            <li>• Each participant will pay their portion individually</li>
            <li>• You can set custom amounts or split equally</li>
          </ul>
        </Card>
      )}
    </div>
  );
};

export default ParticipantManager;