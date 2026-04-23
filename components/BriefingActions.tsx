'use client';

import React, { useState } from 'react';
import { Pencil, Trash2, AlertTriangle } from 'lucide-react';
import { Link, useRouter } from '@/i18n/navigation';
import { opportunityApi } from '../lib/api';

interface BriefingActionsProps {
  opportunityId: string;
  editLabel: string;
  deleteLabel: string;
  deletingLabel: string;
  confirmDeleteTitle: string;
  confirmDeleteMessage: string;
  confirmDeleteBtn: string;
  cancelLabel: string;
}

export function BriefingActions({
  opportunityId,
  editLabel,
  deleteLabel,
  deletingLabel,
  confirmDeleteTitle,
  confirmDeleteMessage,
  confirmDeleteBtn,
  cancelLabel,
}: BriefingActionsProps) {
  const router = useRouter();
  const [showConfirm, setShowConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await opportunityApi.delete(opportunityId);
      router.push('/opportunities');
    } catch {
      setDeleting(false);
      setShowConfirm(false);
    }
  };

  return (
    <>
      <Link
        href={`/opportunities/${opportunityId}/edit`}
        className="flex items-center gap-2 px-5 py-2 bg-surface-container-low text-on-surface text-sm font-bold rounded-xl hover:bg-surface-container-high transition-all active:scale-95 shadow-sm"
      >
        <Pencil className="w-4 h-4" />
        {editLabel}
      </Link>

      <button
        onClick={() => setShowConfirm(true)}
        className="flex items-center gap-2 px-5 py-2 bg-error/10 text-error text-sm font-bold rounded-xl hover:bg-error/20 transition-all active:scale-95"
      >
        <Trash2 className="w-4 h-4" />
        {deleteLabel}
      </button>

      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-on-surface/40 backdrop-blur-sm"
            onClick={() => !deleting && setShowConfirm(false)}
          />
          <div className="relative bg-surface-container-lowest rounded-2xl shadow-2xl p-8 max-w-md w-full">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-10 h-10 rounded-2xl bg-error/10 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-error" />
              </div>
              <div>
                <h3 className="font-headline text-xl font-black text-on-surface mb-2">
                  {confirmDeleteTitle}
                </h3>
                <p className="text-sm text-on-surface-variant leading-relaxed">
                  {confirmDeleteMessage}
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                disabled={deleting}
                className="flex-1 py-3 bg-surface-container-low text-on-surface font-bold rounded-xl hover:bg-surface-container-high transition-colors disabled:opacity-50"
              >
                {cancelLabel}
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 py-3 bg-error text-on-error font-bold rounded-xl hover:bg-error/90 transition-colors disabled:opacity-50"
              >
                {deleting ? deletingLabel : confirmDeleteBtn}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
