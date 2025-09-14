import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNotification } from '../contexts/NotificationContext';
import GlassCard from '../components/ui/GlassCard';
import GlassButton from '../components/ui/GlassButton';
import LoadingSpinner from '../components/common/LoadingSpinner';

const ProfilePage = () => {
  const { user, profile, updateProfile, uploadAvatar, loading } = useAuth();
  const { notify } = useNotification();
  const [isEditing, setIsEditing] = useState(false);
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [formData, setFormData] = useState({
    full_name: '',
    bio: '',
    location: '',
    phone: '',
    date_of_birth: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    travel_preferences: {
      budget: 'moderate',
      accommodation: 'hotel',
      pace: 'moderate',
      interests: []
    }
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || user?.user_metadata?.full_name || '',
        bio: profile.bio || '',
        location: profile.location || '',
        phone: profile.phone || '',
        date_of_birth: profile.date_of_birth || '',
        emergency_contact_name: profile.emergency_contact_name || '',
        emergency_contact_phone: profile.emergency_contact_phone || '',
        travel_preferences: profile.travel_preferences || {
          budget: 'moderate',
          accommodation: 'hotel',
          pace: 'moderate',
          interests: []
        }
      });
    }
  }, [profile, user]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('travel_')) {
      const key = name.replace('travel_', '');
      setFormData(prev => ({
        ...prev,
        travel_preferences: {
          ...prev.travel_preferences,
          [key]: value
        }
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleInterestToggle = (interest) => {
    setFormData(prev => ({
      ...prev,
      travel_preferences: {
        ...prev.travel_preferences,
        interests: prev.travel_preferences.interests.includes(interest)
          ? prev.travel_preferences.interests.filter(i => i !== interest)
          : [...prev.travel_preferences.interests, interest]
      }
    }));
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        notify.error('Image size must be less than 5MB');
        return;
      }
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAvatarUpload = async () => {
    if (!avatarFile) return;

    const result = await uploadAvatar(avatarFile);
    if (result.success) {
      notify.success('Avatar updated successfully');
      setAvatarFile(null);
      setAvatarPreview(null);
    } else {
      notify.error(result.error || 'Failed to upload avatar');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const result = await updateProfile(formData);
    if (result.success) {
      notify.success('Profile updated successfully');
      setIsEditing(false);
    } else {
      notify.error(result.error || 'Failed to update profile');
    }
  };

  const profileCompletion = () => {
    const fields = [
      formData.full_name,
      formData.bio,
      formData.location,
      formData.phone,
      formData.date_of_birth,
      profile?.avatar_url
    ];
    const completed = fields.filter(Boolean).length;
    return Math.round((completed / fields.length) * 100);
  };

  const interests = [
    'Adventure', 'Beach', 'Culture', 'Food', 'Hiking',
    'History', 'Nature', 'Photography', 'Shopping', 'Sports'
  ];

  if (loading) {
    return <LoadingSpinner fullScreen message="Loading profile..." />;
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Profile Header */}
      <GlassCard className="mb-8">
        <div className="flex flex-col md:flex-row items-center gap-6">
          {/* Avatar */}
          <div className="relative group">
            <div className="w-32 h-32 rounded-full overflow-hidden bg-gradient-to-br from-blue-500 to-purple-500 p-1">
              <div className="w-full h-full rounded-full overflow-hidden bg-white dark:bg-gray-900">
                {avatarPreview || profile?.avatar_url ? (
                  <img
                    src={avatarPreview || profile.avatar_url}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-4xl font-bold text-gray-400">
                    {user?.email?.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
            </div>
            {isEditing && (
              <label className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={handleAvatarChange}
                />
              </label>
            )}
          </div>

          {/* Profile Info */}
          <div className="flex-1 text-center md:text-left">
            <h1 className="text-3xl font-bold mb-2">
              {formData.full_name || 'Your Name'}
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              {user?.email}
            </p>
            <div className="flex items-center justify-center md:justify-start gap-4">
              <div className="text-sm">
                <span className="text-gray-500">Member since:</span>
                <span className="ml-2 font-medium">
                  {new Date(user?.created_at || Date.now()).toLocaleDateString()}
                </span>
              </div>
              <div className="text-sm">
                <span className="text-gray-500">Profile:</span>
                <span className="ml-2 font-medium">
                  {profileCompletion()}% complete
                </span>
              </div>
            </div>
          </div>

          {/* Edit Button */}
          <div>
            {!isEditing ? (
              <GlassButton
                variant="primary"
                onClick={() => setIsEditing(true)}
              >
                Edit Profile
              </GlassButton>
            ) : (
              <div className="flex gap-2">
                {avatarFile && (
                  <GlassButton
                    variant="accent"
                    onClick={handleAvatarUpload}
                  >
                    Save Avatar
                  </GlassButton>
                )}
                <GlassButton
                  variant="ghost"
                  onClick={() => {
                    setIsEditing(false);
                    setAvatarFile(null);
                    setAvatarPreview(null);
                  }}
                >
                  Cancel
                </GlassButton>
              </div>
            )}
          </div>
        </div>

        {/* Profile Completion Bar */}
        {profileCompletion() < 100 && (
          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Profile Completion</span>
              <span className="text-sm text-blue-600 dark:text-blue-400">
                {profileCompletion()}%
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all"
                style={{ width: `${profileCompletion()}%` }}
              />
            </div>
          </div>
        )}
      </GlassCard>

      {/* Profile Form */}
      <form onSubmit={handleSubmit}>
        {/* Personal Information */}
        <GlassCard className="mb-6">
          <h2 className="text-xl font-semibold mb-4">Personal Information</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Full Name</label>
              <input
                type="text"
                name="full_name"
                value={formData.full_name}
                onChange={handleInputChange}
                disabled={!isEditing}
                className="w-full px-4 py-2 glass-input rounded-lg"
                placeholder="John Doe"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Phone</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                disabled={!isEditing}
                className="w-full px-4 py-2 glass-input rounded-lg"
                placeholder="+1 234 567 8900"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Location</label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                disabled={!isEditing}
                className="w-full px-4 py-2 glass-input rounded-lg"
                placeholder="New York, USA"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Date of Birth</label>
              <input
                type="date"
                name="date_of_birth"
                value={formData.date_of_birth}
                onChange={handleInputChange}
                disabled={!isEditing}
                className="w-full px-4 py-2 glass-input rounded-lg"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Bio</label>
              <textarea
                name="bio"
                value={formData.bio}
                onChange={handleInputChange}
                disabled={!isEditing}
                rows={3}
                className="w-full px-4 py-2 glass-input rounded-lg resize-none"
                placeholder="Tell us about yourself..."
              />
            </div>
          </div>
        </GlassCard>

        {/* Emergency Contact */}
        <GlassCard className="mb-6">
          <h2 className="text-xl font-semibold mb-4">Emergency Contact</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Contact Name</label>
              <input
                type="text"
                name="emergency_contact_name"
                value={formData.emergency_contact_name}
                onChange={handleInputChange}
                disabled={!isEditing}
                className="w-full px-4 py-2 glass-input rounded-lg"
                placeholder="Jane Doe"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Contact Phone</label>
              <input
                type="tel"
                name="emergency_contact_phone"
                value={formData.emergency_contact_phone}
                onChange={handleInputChange}
                disabled={!isEditing}
                className="w-full px-4 py-2 glass-input rounded-lg"
                placeholder="+1 234 567 8900"
              />
            </div>
          </div>
        </GlassCard>

        {/* Travel Preferences */}
        <GlassCard className="mb-6">
          <h2 className="text-xl font-semibold mb-4">Travel Preferences</h2>
          <div className="space-y-4">
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Budget</label>
                <select
                  name="travel_budget"
                  value={formData.travel_preferences.budget}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className="w-full px-4 py-2 glass-input rounded-lg"
                >
                  <option value="budget">Budget</option>
                  <option value="moderate">Moderate</option>
                  <option value="luxury">Luxury</option>
                  <option value="flexible">Flexible</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Accommodation</label>
                <select
                  name="travel_accommodation"
                  value={formData.travel_preferences.accommodation}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className="w-full px-4 py-2 glass-input rounded-lg"
                >
                  <option value="hostel">Hostel</option>
                  <option value="hotel">Hotel</option>
                  <option value="resort">Resort</option>
                  <option value="airbnb">Airbnb</option>
                  <option value="camping">Camping</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Travel Pace</label>
                <select
                  name="travel_pace"
                  value={formData.travel_preferences.pace}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className="w-full px-4 py-2 glass-input rounded-lg"
                >
                  <option value="slow">Slow & Relaxed</option>
                  <option value="moderate">Moderate</option>
                  <option value="fast">Fast-paced</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Interests</label>
              <div className="flex flex-wrap gap-2">
                {interests.map(interest => (
                  <button
                    key={interest}
                    type="button"
                    disabled={!isEditing}
                    onClick={() => handleInterestToggle(interest)}
                    className={`px-3 py-1 rounded-full text-sm transition-colors ${
                      formData.travel_preferences.interests.includes(interest)
                        ? 'bg-blue-500 text-white'
                        : 'bg-glass-light hover:bg-glass-heavy'
                    } ${!isEditing && 'cursor-not-allowed opacity-60'}`}
                  >
                    {interest}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </GlassCard>

        {/* Save Button */}
        {isEditing && (
          <div className="flex justify-end gap-4">
            <GlassButton
              type="button"
              variant="ghost"
              onClick={() => setIsEditing(false)}
            >
              Cancel
            </GlassButton>
            <GlassButton
              type="submit"
              variant="primary"
              disabled={loading}
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </GlassButton>
          </div>
        )}
      </form>
    </div>
  );
};

export default ProfilePage;
