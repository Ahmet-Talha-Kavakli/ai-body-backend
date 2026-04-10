'use client';
import { FriendsListPanel } from '@/components/social/FriendsListPanel';

export default function SocialDashboard() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">Friends & Community</h1>
        <FriendsListPanel />
      </div>
    </div>
  );
}
