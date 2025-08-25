'use client';

import React, { useState } from 'react';
import Avatar from './Avatar';
import { useAuth } from '@/contexts/AuthContext';

interface AvatarUploaderProps {
  userId: string;
  name: string;
  avatarUrl?: string | null;
  avatarUpdatedAt?: string | null;
  onUploaded?: (url: string, updatedAt?: string) => void;
}

const AvatarUploader: React.FC<AvatarUploaderProps> = ({ userId, name, avatarUrl, avatarUpdatedAt, onUploaded }) => {
  const { token, user, updateUser } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const canEdit = user?.id === userId || user?.role === 'admin' || user?.role === 'superadmin';

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setPreviewUrl(URL.createObjectURL(file));
    if (!token) { setError('Not authenticated'); return; }

    const formData = new FormData();
    formData.append('file', file);

    setIsUploading(true);
    try {
      const res = await fetch(`/api/users/${userId}/avatar`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Upload failed');
      // Update global auth user so all places reflect new avatar immediately
      updateUser({ avatarUrl: data.avatarUrl, avatarUpdatedAt: data.avatarUpdatedAt });
      onUploaded?.(data.avatarUrl, data.avatarUpdatedAt);
    } catch (err: any) {
      setError(err.message || 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="flex items-center gap-3">
      <Avatar src={previewUrl || avatarUrl || undefined} updatedAt={avatarUpdatedAt || undefined} name={name} size={64} />
      <div className="flex flex-col">
        {canEdit && (
          <label className="inline-block">
            <span className={`px-3 py-1 rounded cursor-pointer text-white ${isUploading ? 'bg-gray-400' : 'bg-indigo-600 hover:bg-indigo-700'}`}>
              {isUploading ? 'Uploading...' : 'Change photo'}
            </span>
            <input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={handleFileChange} disabled={isUploading} />
          </label>
        )}
        {error && <span className="text-red-600 text-sm mt-1">{error}</span>}
        <span className="text-xs text-gray-500 mt-1">JPEG/PNG/WebP up to 5MB</span>
      </div>
    </div>
  );
};

export default AvatarUploader;


