"use client"

import { useState } from 'react';
import { SubscriptionActivationModal } from '@/components/users/subscription-activation-modal';
import { useTranslation } from 'react-i18next';
// ... existing imports ...

export function UsersTable() {
  const { t } = useTranslation();
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [showActivationModal, setShowActivationModal] = useState(false);
  // ... existing state ...

  const handleActivateSubscription = (userId: string) => {
    setSelectedUserId(userId);
    setShowActivationModal(true);
  };

  const handleActivationSuccess = () => {
    // Refresh the users list
    // fetchUsers();
  };

  // Add a new column for subscription activation
  const columns = [
    // ... existing columns ...
    {
      id: 'actions',
      cell: ({ row }) => {
        const user = row.original;
        return (
          <div className="flex items-center gap-2">
            {/* ... existing actions ... */}
            {user.role === 'user' && (
              <button
                className="px-3 py-1 text-sm border rounded hover:bg-gray-100"
                onClick={() => handleActivateSubscription(user._id)}
              >
                {t('usersTable.activateSubscription')}
              </button>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <>
      {/* ... existing table JSX ... */}
      
      {selectedUserId && (
        <SubscriptionActivationModal
          isOpen={showActivationModal}
          onClose={() => {
            setShowActivationModal(false);
            setSelectedUserId(null);
          }}
          userId={selectedUserId}
          onSuccess={handleActivationSuccess}
        />
      )}
    </>
  );
} 