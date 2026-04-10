'use client';
import React, { useState } from 'react';

export function FriendsListPanel() {
  const [friends, setFriends] = useState<Array<{ id: string; name: string; status: string }>>([]);

  const handleAddFriend = async (friendId: string) => {
    const res = await fetch('/api/user/friends/add', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ friendId }),
    });
    if (res.ok) {
      // Refresh friends list
      fetchFriends();
    }
  };

  const fetchFriends = async () => {
    const res = await fetch('/api/user/friends/list');
    if (res.ok) {
      const data = await res.json();
      setFriends(data.data || []);
    }
  };

  React.useEffect(() => {
    fetchFriends();
  }, []);

  return (
    <div className="w-full bg-white rounded-lg shadow p-4">
      <h2 className="text-xl font-bold mb-4">Friends</h2>
      <div className="space-y-2">
        {friends.map(friend => (
          <div key={friend.id} className="flex items-center justify-between p-2 border rounded">
            <span className="font-medium">{friend.name}</span>
            <span className="text-sm text-gray-600">{friend.status}</span>
          </div>
        ))}
      </div>
      {friends.length === 0 && (
        <p className="text-gray-600 text-center py-4">No friends yet</p>
      )}
    </div>
  );
}
