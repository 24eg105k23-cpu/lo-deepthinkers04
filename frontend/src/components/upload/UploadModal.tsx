import { useState, useCallback, useEffect } from 'react';
import { Upload as UploadIcon, FileText, X, CheckCircle2, Loader2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { API_URL } from '@/lib/utils';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

interface UploadedFile {
    id: string;
    name: string;
    size: number;
    status: 'uploading' | 'processing' | 'complete' | 'error';
    progress: number;
}

interface UploadModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    defaultWorkspaceId?: string; // Optional: pre-select a workspace
}

const UploadModal = ({ open, onOpenChange, defaultWorkspaceId }: UploadModalProps) => {
    const [files, setFiles] = useState<UploadedFile[]>([]);
    const [isDragging, setIsDragging] = useState(false);
    const [workspaces, setWorkspaces] = useState<any[]>([]);
    const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string>(defaultWorkspaceId || '');

    useEffect(() => {
        if (open) {
            fetchWorkspaces();
            setFiles([]); // Reset files on open
        }
    }, [open]);

    useEffect(() => {
        if (defaultWorkspaceId) {
            setSelectedWorkspaceId(defaultWorkspaceId);
        }
    }, [defaultWorkspaceId]);


    const fetchWorkspaces = async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;

            const res = await fetch(`${API_URL}/workspaces/`, {
                headers: { 'Authorization': `Bearer ${session.access_token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setWorkspaces(data);
                if (!selectedWorkspaceId && data.length > 0) setSelectedWorkspaceId(data[0].id);
            }
        } catch (error) {
            console.error("Failed to fetch workspaces", error);
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const processFile = async (file: File) => {
        if (!selectedWorkspaceId) {
            toast.error("Please select a workspace first");
            return;
        }

        const uploadedFile: UploadedFile = {
            id: Date.now().toString(),
            name: file.name,
            size: file.size,
            status: 'uploading',
            progress: 0,
        };

        setFiles((prev) => [...prev, uploadedFile]);

        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) throw new Error("Not authenticated");

            const formData = new FormData();
            formData.append('file', file);

            // Simulate progress while uploading
            const progressInterval = setInterval(() => {
                setFiles(prev => prev.map(f =>
                    f.id === uploadedFile.id && f.progress < 90
                        ? { ...f, progress: f.progress + 10 }
                        : f
                ));
            }, 500);

            const res = await fetch(`${API_URL}/rag/upload?workspace_id=${selectedWorkspaceId}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${session.access_token}`
                },
                body: formData
            });

            clearInterval(progressInterval);

            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.detail || "Upload failed");
            }

            const data = await res.json();

            setFiles((prev) =>
                prev.map((f) =>
                    f.id === uploadedFile.id ? { ...f, status: 'complete', progress: 100 } : f
                )
            );
            toast.success(`"${file.name}" uploaded and indexed successfully`);

        } catch (error: any) {
            console.error(error);
            setFiles((prev) =>
                prev.map((f) =>
                    f.id === uploadedFile.id ? { ...f, status: 'error', progress: 0 } : f
                )
            );
            toast.error(`Failed to upload ${file.name}: ${error.message}`);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);

        const droppedFiles = Array.from(e.dataTransfer.files).filter(
            (file) => file.type === 'application/pdf'
        );

        if (droppedFiles.length === 0) {
            toast.error('Please upload PDF files only');
            return;
        }

        droppedFiles.forEach(processFile);
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFiles = Array.from(e.target.files || []).filter(
            (file) => file.type === 'application/pdf'
        );

        if (selectedFiles.length === 0) {
            toast.error('Please upload PDF files only');
            return;
        }

        selectedFiles.forEach(processFile);
    };

    const removeFile = (id: string) => {
        setFiles((prev) => prev.filter((f) => f.id !== id));
    };

    const formatFileSize = (bytes: number) => {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Upload PDF</DialogTitle>
                    <DialogDescription>
                        Import research papers from your collection
                    </DialogDescription>
                </DialogHeader>

                <div className="flex flex-col gap-4">
                    {/* Workspace Selector */}
                    <div className="flex flex-col gap-2">
                        <span className="text-sm font-medium text-muted-foreground">Select Workspace</span>
                        <select
                            value={selectedWorkspaceId}
                            onChange={(e) => setSelectedWorkspaceId(e.target.value)}
                            className="bg-card border border-border rounded-md px-3 py-2 text-sm w-full md:w-1/2"
                        >
                            <option value="" disabled>Select a workspace</option>
                            {workspaces.map(w => (
                                <option key={w.id} value={w.id}>{w.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="grid lg:grid-cols-2 gap-6">
                        {/* Upload Area */}
                        <Card className="glass-card border-border/50">
                            <CardHeader>
                                <CardTitle>Upload Papers</CardTitle>
                                <CardDescription>
                                    Drag and drop PDF files or click to browse
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div
                                    className={`relative border-2 border-dashed rounded-xl p-12 text-center transition-colors ${isDragging
                                        ? 'border-primary bg-primary/5'
                                        : 'border-border/50 hover:border-primary/50'
                                        }`}
                                    onDragOver={handleDragOver}
                                    onDragLeave={handleDragLeave}
                                    onDrop={handleDrop}
                                >
                                    <input
                                        type="file"
                                        accept=".pdf"
                                        multiple
                                        onChange={handleFileSelect}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                    />
                                    <div className="w-16 h-16 rounded-2xl bg-gradient-primary flex items-center justify-center mx-auto mb-4 glow-primary">
                                        <UploadIcon className="h-8 w-8 text-primary-foreground" />
                                    </div>
                                    <p className="text-foreground font-medium mb-2">
                                        Drop your PDF files here
                                    </p>
                                    <p className="text-sm text-muted-foreground mb-4">
                                        or click to browse from your computer
                                    </p>
                                    <Button variant="outline" className="pointer-events-none">
                                        Select Files
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>

                        {/* File List */}
                        <Card className="glass-card border-border/50">
                            <CardHeader>
                                <CardTitle>Uploaded Files</CardTitle>
                                <CardDescription>
                                    {files.length === 0
                                        ? 'No files uploaded yet'
                                        : `${files.length} file(s) uploaded`}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-3 max-h-[400px] overflow-y-auto scrollbar-thin">
                                {files.length === 0 ? (
                                    <div className="text-center py-8">
                                        <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                                        <p className="text-muted-foreground">
                                            Upload PDFs to see them here
                                        </p>
                                    </div>
                                ) : (
                                    files.map((file) => (
                                        <div
                                            key={file.id}
                                            className="flex items-center gap-4 p-4 rounded-xl bg-secondary/30"
                                        >
                                            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                                                <FileText className="h-5 w-5 text-primary" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium text-foreground truncate">
                                                    {file.name}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    {formatFileSize(file.size)}
                                                </p>
                                                {file.status === 'uploading' && (
                                                    <Progress value={file.progress} className="h-1 mt-2" />
                                                )}
                                            </div>
                                            <div className="flex-shrink-0">
                                                {file.status === 'uploading' && (
                                                    <span className="text-xs text-muted-foreground">
                                                        {file.progress}%
                                                    </span>
                                                )}
                                                {file.status === 'processing' && (
                                                    <div className="flex items-center gap-2 text-primary">
                                                        <Loader2 className="h-4 w-4 animate-spin" />
                                                        <span className="text-xs">Processing...</span>
                                                    </div>
                                                )}
                                                {file.status === 'complete' && (
                                                    <div className="flex items-center gap-2">
                                                        <CheckCircle2 className="h-5 w-5 text-primary" />
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8"
                                                            onClick={() => removeFile(file.id)}
                                                        >
                                                            <X className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default UploadModal;
