/**
 * Contract Type Create & Edit Modal Form
 * 
 * RESPONSIBILITY:
 * Provides a modal dialog for creating and updating contract type configurations
 * (e.g. Permanent, Fixed-Term, Contractor, Probation, Part-Time).
 */

import React, { useState, useEffect } from 'react';
import {
  Input,
  Textarea,
  Button,
  Alert,
  Typography
} from '@material-tailwind/react';
import { InformationCircleIcon } from '@heroicons/react/24/solid';
import Modal from '../common/Modal';
import axiosClient from '../../api/axiosClient';

/**
 * Contract Type Modal Form.
 * 
 * @param {object} props
 * @param {boolean} props.open - Modal open state
 * @param {Function} props.onClose - Close handler
 * @param {object|null} [props.contractType] - Existing contract type object if editing
 * @param {Function} props.onSuccess - Callback upon successful save
 * @returns {JSX.Element}
 */
export default function ContractTypeModal({
  open,
  onClose,
  contractType = null,
  onSuccess
}) {
  const isEdit = !!contractType?.id;

  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [defaultDuration, setDefaultDuration] = useState('');
  const [defaultTerms, setDefaultTerms] = useState('');
  const [status, setStatus] = useState('active');

  const [touched, setTouched] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (contractType) {
      setName(contractType.name || '');
      setCode(contractType.code || '');
      setDescription(contractType.description || '');
      setDefaultDuration(contractType.default_duration || '');
      setDefaultTerms(contractType.default_terms || '');
      setStatus(contractType.status || 'active');
    } else {
      setName('');
      setCode('');
      setDescription('');
      setDefaultDuration('');
      setDefaultTerms('');
      setStatus('active');
    }
    setTouched({});
    setErrorMessage('');
  }, [contractType, open]);

  const nameError = !name.trim() ? 'Contract type name is required' : null;

  const handleNameChange = (val) => {
    setName(val);
    if (!isEdit && !code) {
      setCode(val.toLowerCase().replace(/[^a-z0-9_]/g, '_'));
    }
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setTouched({ name: true });

    if (nameError) return;

    setErrorMessage('');
    setSubmitting(true);

    try {
      const payload = {
        name: name.trim(),
        code: code.trim() || name.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_'),
        description: description.trim() || null,
        default_duration: defaultDuration.trim() || null,
        default_terms: defaultTerms.trim() || null,
        status
      };

      if (isEdit) {
        await axiosClient.put(`/contract-types/${contractType.id}`, payload);
      } else {
        await axiosClient.post('/contract-types', payload);
      }

      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      const msg = err.response?.data?.error?.message || err.response?.data?.message || 'Failed to save contract type.';
      setErrorMessage(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? `Edit Contract Type: ${contractType?.name}` : 'Add New Contract Type'}
      size="md"
      footer={
        <>
          <Button variant="text" color="blue-gray" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button color="indigo" onClick={handleSubmit} disabled={submitting}>
            {submitting ? 'Saving...' : isEdit ? 'Update Contract Type' : 'Create Contract Type'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {errorMessage && (
          <Alert color="red" variant="gradient" icon={<InformationCircleIcon className="h-5 w-5" />}>
            <span className="text-xs font-medium">{errorMessage}</span>
          </Alert>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Typography variant="small" color="blue-gray" className="font-semibold mb-1 text-xs">
              Contract Type Name *
            </Typography>
            <Input
              type="text"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              onBlur={() => setTouched((p) => ({ ...p, name: true }))}
              error={!!(touched.name && nameError)}
              placeholder="e.g. Permanent / Full-Time"
              required
            />
            {touched.name && nameError && (
              <p className="text-[11px] text-red-500 mt-1">{nameError}</p>
            )}
          </div>

          <div>
            <Typography variant="small" color="blue-gray" className="font-semibold mb-1 text-xs">
              Identifier Code (System Key)
            </Typography>
            <Input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="e.g. permanent"
              disabled={isEdit}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Typography variant="small" color="blue-gray" className="font-semibold mb-1 text-xs">
              Standard Default Duration
            </Typography>
            <Input
              type="text"
              value={defaultDuration}
              onChange={(e) => setDefaultDuration(e.target.value)}
              placeholder="e.g. Indefinite / 12 Months"
            />
          </div>

          <div>
            <Typography variant="small" color="blue-gray" className="font-semibold mb-1 text-xs">
              Status *
            </Typography>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full h-10 px-3 rounded-md border border-blue-gray-200 text-sm focus:border-indigo-600 focus:outline-none"
            >
              <option value="active">Active (Available for Contracts)</option>
              <option value="inactive">Inactive / Archived</option>
            </select>
          </div>
        </div>

        <div>
          <Typography variant="small" color="blue-gray" className="font-semibold mb-1 text-xs">
            Contract Terms & Policies
          </Typography>
          <Input
            type="text"
            value={defaultTerms}
            onChange={(e) => setDefaultTerms(e.target.value)}
            placeholder="e.g. Standard 30-day notice, full PTO & insurance"
          />
        </div>

        <div>
          <Typography variant="small" color="blue-gray" className="font-semibold mb-1 text-xs">
            Description & Purpose
          </Typography>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Explain when to assign this contract archetype..."
            rows={3}
          />
        </div>
      </form>
    </Modal>
  );
}
