'use client';
import { useState, useEffect } from 'react';

export default function CompareWithFriend({ params }: { params: { friendId: string } }) {
  const [comparison, setComparison] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchComparison = async () => {
      const res = await fetch(`/api/user/compare/${params.friendId}`);
      if (res.ok) {
        const data = await res.json();
        setComparison(data.data);
      }
      setLoading(false);
    };
    fetchComparison();
  }, [params.friendId]);

  if (loading) return <div className="p-8">Loading comparison...</div>;
  if (!comparison) return <div className="p-8">Friend not found</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">Compare with {comparison.friendName}</h1>

        <div className="grid grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-bold mb-4">You</h3>
            <div className="space-y-2 text-gray-700">
              <p>Form Score: {comparison.yourFormScore}</p>
              <p>Consistency: {comparison.yourConsistency}%</p>
              <p>Recovery: {comparison.yourRecovery}%</p>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-bold mb-4">{comparison.friendName}</h3>
            <div className="space-y-2 text-gray-700">
              <p>Form Score: {comparison.friendFormScore}</p>
              <p>Consistency: {comparison.friendConsistency}%</p>
              <p>Recovery: {comparison.friendRecovery}%</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
