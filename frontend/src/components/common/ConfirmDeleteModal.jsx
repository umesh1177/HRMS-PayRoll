import React from 'react';
import {
  Dialog,
  DialogHeader,
  DialogBody,
  DialogFooter,
  Typography,
  Button,
  Spinner,
  Alert
} from '@material-tailwind/react';
import { ExclamationTriangleIcon, InformationCircleIcon } from '@heroicons/react/24/solid';

/**
 * Confirm Delete Dialog Modal.
 * 
 * @param {object} props
 * @param {boolean} props.open - Open state
 * @param {Function} props.onClose - Close handler
 * @param {Function} props.onConfirm - Confirm delete handler
 * @param {string} [props.title='Confirm Deletion'] - Modal title
 * @param {string} [props.itemName='this item'] - Name/description of item being deleted
 * @param {string} [props.description] - Custom description text
 * @param {string} [props.errorMessage] - Inline error message to display
 * @param {boolean} [props.loading=false] - Submitting state
 * @returns {JSX.Element}
 */
export default function ConfirmDeleteModal({
  open,
  onClose,
  onConfirm,
  title = 'Confirm Deletion',
  itemName = 'this item',
  description,
  errorMessage,
  loading = false
}) {
  return (
    <Dialog open={open} handler={onClose} size="xs" className="p-4 rounded-xl">
      <DialogHeader className="flex items-center gap-3 pb-2 text-red-600">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-50 text-red-500 shrink-0">
          <ExclamationTriangleIcon className="h-6 w-6" />
        </div>
        <Typography variant="h6" color="blue-gray" className="font-bold">
          {title}
        </Typography>
      </DialogHeader>

      <DialogBody className="py-3 flex flex-col gap-3">
        {errorMessage && (
          <Alert color="red" variant="gradient" icon={<InformationCircleIcon className="h-5 w-5" />}>
            <span className="text-xs font-medium">{errorMessage}</span>
          </Alert>
        )}

        <Typography variant="small" color="blue-gray" className="text-sm font-normal">
          {description || (
            <>
              Are you sure you want to delete <strong className="text-blue-gray-900">{itemName}</strong>? This action will permanently remove the record.
            </>
          )}
        </Typography>
      </DialogBody>

      <DialogFooter className="border-t border-blue-gray-100 pt-3 flex justify-end gap-2">
        <Button variant="text" color="blue-gray" size="sm" onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          color="red"
          size="sm"
          onClick={onConfirm}
          disabled={loading}
          className="flex items-center gap-2 shadow-red-500/20"
        >
          {loading ? (
            <>
              <Spinner className="h-4 w-4" /> Deleting...
            </>
          ) : (
            'Delete'
          )}
        </Button>
      </DialogFooter>
    </Dialog>
  );
}
