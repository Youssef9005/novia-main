import { useState } from 'react';
import type { User } from "@/lib/types";
import { useTranslation } from "react-i18next";
import { SubscriptionActivationModal } from '@/components/users/subscription-activation-modal';
// ... existing imports ...

export function UsersTable() {
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [showActivationModal, setShowActivationModal] = useState(false);
  // ... existing state ...

  const handleActivateSubscription = (userId: string) => {
    setSelectedUserId(userId);
    setShowActivationModal(true);
  };

  const handleActivationSuccess = () => {
    // Refresh the users list
    fetchUsers();
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
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleActivateSubscription(user._id)}
              >
                Activate Subscription
              </Button>
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