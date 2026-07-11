import React, { useCallback, useEffect, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { FileText, Upload, PenLine, ExternalLink, Eye } from 'lucide-react';
import toast from 'react-hot-toast';
import { Document, Page, pdfjs } from 'react-pdf';
import { Card, CardHeader, CardBody } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { apiGetMyDocuments, apiUploadDocument, apiSignDocument, API_ORIGIN } from '../../lib/api';

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();

interface ApiDocument {
  _id: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
  status: 'draft' | 'pending_signature' | 'signed' | 'archived';
  version: number;
  owner: { name: string };
  createdAt: string;
}

export const DocumentsPage: React.FC = () => {
  const [documents, setDocuments] = useState<ApiDocument[]>([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [previewDoc, setPreviewDoc] = useState<ApiDocument | null>(null);
  const [numPages, setNumPages] = useState(0);

  const load = () => {
    apiGetMyDocuments()
      .then((res) => setDocuments(res.data))
      .catch(() => toast.error('Could not load documents'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;
    setUploading(true);
    apiUploadDocument(file)
      .then(() => { toast.success('Document uploaded'); load(); })
      .catch((err) => toast.error(err?.response?.data?.message || 'Upload failed'))
      .finally(() => setUploading(false));
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'image/png': ['.png'],
      'image/jpeg': ['.jpg', '.jpeg'],
    },
    maxSize: 10 * 1024 * 1024,
  });

  const handleSign = (id: string) => {
    const placeholderSignature = 'https://ui-avatars.com/api/?name=Signed&background=22C55E&color=fff';
    apiSignDocument(id, placeholderSignature)
      .then(() => { toast.success('Document signed'); setPreviewDoc(null); load(); })
      .catch((err) => toast.error(err?.response?.data?.message || 'Sign failed'));
  };

  const statusBadge = (status: ApiDocument['status']) => {
    if (status === 'signed') return <Badge variant="success">Signed</Badge>;
    if (status === 'pending_signature') return <Badge variant="accent">Pending signature</Badge>;
    return <Badge variant="gray">Draft</Badge>;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Documents</h1>
          <p className="text-gray-600">Upload, share, and e-sign important files</p>
        </div>
      </div>

      <Card>
        <CardBody>
          <div {...getRootProps()} className={`border-2 border-dashed rounded-lg p-10 text-center cursor-pointer transition-colors ${isDragActive ? 'border-primary-500 bg-primary-50' : 'border-gray-300 hover:border-primary-400'}`}>
            <input {...getInputProps()} />
            <Upload size={28} className="mx-auto text-primary-600 mb-3" />
            <p className="text-sm font-medium text-gray-900">{uploading ? 'Uploading\u2026' : isDragActive ? 'Drop the file here' : 'Drag & drop a file, or click to browse'}</p>
            <p className="text-xs text-gray-500 mt-1">PDF, DOC, DOCX, PNG, JPG \u2014 up to 10MB</p>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="text-lg font-medium text-gray-900">All Documents</h2>
        </CardHeader>
        <CardBody>
          {loading ? (
            <p className="text-sm text-gray-500 py-6 text-center">Loading\u2026</p>
          ) : documents.length === 0 ? (
            <p className="text-sm text-gray-500 py-6 text-center">No documents yet \u2014 upload one above.</p>
          ) : (
            <div className="space-y-2">
              {documents.map((doc) => (
                <div key={doc._id} className="flex items-center p-4 hover:bg-gray-50 rounded-lg transition-colors duration-200">
                  <div className="p-2 bg-primary-50 rounded-lg mr-4">
                    <FileText size={24} className="text-primary-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-900 truncate">{doc.fileName}</span>
                      {statusBadge(doc.status)}
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                      <span>v{doc.version}</span>
                      <span>uploaded by {doc.owner?.name}</span>
                      <span>{new Date(doc.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    {doc.fileType === 'application/pdf' && (
                      <Button variant="ghost" size="sm" className="p-2" aria-label="Preview" onClick={() => { setPreviewDoc(doc); setNumPages(0); }}>
                        <Eye size={18} />
                      </Button>
                    )}
                    <a href={`${API_ORIGIN}${doc.fileUrl}`} target="_blank" rel="noreferrer">
                      <Button variant="ghost" size="sm" className="p-2" aria-label="Open">
                        <ExternalLink size={18} />
                      </Button>
                    </a>
                    {doc.status !== 'signed' && (
                      <Button variant="outline" size="sm" leftIcon={<PenLine size={16} />} onClick={() => handleSign(doc._id)}>
                        E-sign
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>

      {previewDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setPreviewDoc(null)}>
          <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl mx-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="font-semibold text-gray-900 truncate">{previewDoc.fileName}</h3>
              <div className="flex items-center gap-2">
                {previewDoc.status !== 'signed' && (
                  <Button size="sm" leftIcon={<PenLine size={16} />} onClick={() => { handleSign(previewDoc._id); }}>
                    E-sign
                  </Button>
                )}
                <Button variant="ghost" size="sm" onClick={() => setPreviewDoc(null)}>Close</Button>
              </div>
            </div>
            <div className="p-4">
              <Document
                file={`${API_ORIGIN}${previewDoc.fileUrl}`}
                onLoadSuccess={({ numPages: n }) => setNumPages(n)}
                loading={<p className="text-center text-gray-500 py-10">Loading PDF\u2026</p>}
                error={<p className="text-center text-error-600 py-10">Failed to load PDF</p>}
              >
                {Array.from({ length: numPages }, (_, i) => (
                  <Page key={i} pageNumber={i + 1} className="mb-4 flex justify-center" />
                ))}
              </Document>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
