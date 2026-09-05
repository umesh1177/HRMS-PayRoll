/**
 * Payslip Print & Download Utility
 * 
 * RESPONSIBILITY:
 * Handles client-side printing and downloading of official payslip documents.
 * Fetches the authenticated HTML payload via axiosClient and either triggers the browser
 * print dialog or downloads the document file directly to the user's disk.
 */

import axiosClient from '../api/axiosClient';

/**
 * Fetches and prints a payslip using an isolated print iframe or window.
 * 
 * @param {number|string} payslipId - ID of the payslip
 * @returns {Promise<void>}
 */
export async function printPayslip(payslipId) {
  try {
    const res = await axiosClient.get(`/payroll/payslips/${payslipId}/pdf`, {
      responseType: 'text'
    });
    const htmlContent = res.data;

    // Create an invisible iframe for reliable, cross-browser printing without popup blocker issues
    let printIframe = document.getElementById('payslip-print-iframe');
    if (!printIframe) {
      printIframe = document.createElement('iframe');
      printIframe.id = 'payslip-print-iframe';
      printIframe.style.position = 'fixed';
      printIframe.style.right = '0';
      printIframe.style.bottom = '0';
      printIframe.style.width = '0';
      printIframe.style.height = '0';
      printIframe.style.border = 'none';
      document.body.appendChild(printIframe);
    }

    const doc = printIframe.contentWindow.document;
    doc.open();
    doc.write(htmlContent);
    doc.close();

    // Give browser brief tick to parse styles and render layout before printing
    setTimeout(() => {
      printIframe.contentWindow.focus();
      printIframe.contentWindow.print();
    }, 300);
  } catch (err) {
    console.error('Failed to print payslip:', err);
    // Fallback: open in new window
    const token = localStorage.getItem('token');
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';
    window.open(`${baseUrl}/payroll/payslips/${payslipId}/pdf?token=${token}`, '_blank');
  }
}

/**
 * Downloads the payslip file directly to the user's disk.
 * 
 * @param {number|string} payslipId - ID of the payslip
 * @param {string} [filename] - Custom filename
 * @returns {Promise<void>}
 */
export async function downloadPayslip(payslipId, filename = '') {
  try {
    const res = await axiosClient.get(`/payroll/payslips/${payslipId}/pdf`, {
      responseType: 'text'
    });
    const htmlContent = res.data;

    const finalFilename = filename || `payslip-#${payslipId}.html`;
    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = finalFilename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (err) {
    console.error('Failed to download payslip:', err);
    const token = localStorage.getItem('token');
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';
    window.open(`${baseUrl}/payroll/payslips/${payslipId}/pdf?token=${token}`, '_blank');
  }
}
