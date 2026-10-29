'use client';

import { Modal } from './ui';
import { MediaLibrary } from './MediaLibrary';

export function MediaPicker({ onClose, onPick, accept = 'image' }: { onClose: () => void; onPick: (v: string) => void; accept?: 'image' | 'any' }) {
  return (
    <Modal title={accept === 'image' ? 'Choose an image' : 'Choose a file'} onClose={onClose} large>
      <div className="modal-body flush">
        <MediaLibrary
          mode="picker"
          accept={accept}
          onPick={(v) => {
            onPick(v);
            onClose();
          }}
        />
      </div>
    </Modal>
  );
}
