/**
 * Reusable Dialog Modal Component
 * 
 * RESPONSIBILITY:
 * Provides a standardized Material Tailwind Dialog wrapper for CRUD forms and confirmation prompts.
 * 
 * NOT RESPONSIBLE FOR:
 * Specific form fields or domain-specific submission actions.
 */

import React from 'react';
import {
  Dialog,
  DialogHeader,
  DialogBody,
  DialogFooter,
  Typography,
  IconButton
} from '@material-tailwind/react';
import { XMarkIcon } from '@heroicons/react/24/outline';

/**
 * Common Modal Dialog.
 * 
 * @param {object} props - Component props
 * @param {boolean} props.open - Modal open state
 * @param {Function} props.onClose - Close handler
 * @param {string} props.title - Modal title text
 * @param {React.ReactNode} props.children - Modal body content
 * @param {React.ReactNode} [props.footer] - Optional footer action buttons
 * @param {string} [props.size='md'] - Dialog size ('xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl')
 * @returns {JSX.Element} Material Tailwind Dialog wrapper
 */
export default function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  size = 'md'
}) {
  return (
    <Dialog open={open} handler={onClose} size={size} className="p-4">
      <DialogHeader className="flex items-center justify-between pb-2 border-b border-blue-gray-100">
        <Typography variant="h5" color="blue-gray" className="font-bold">
          {title}
        </Typography>
        <IconButton variant="text" color="blue-gray" onClick={onClose} className="rounded-full">
          <XMarkIcon className="h-5 w-5" />
        </IconButton>
      </DialogHeader>

      <DialogBody className="max-h-[75vh] overflow-y-auto pt-4 pb-2">
        {children}
      </DialogBody>

      {footer && (
        <DialogFooter className="border-t border-blue-gray-100 pt-3 flex justify-end gap-2">
          {footer}
        </DialogFooter>
      )}
    </Dialog>
  );
}
