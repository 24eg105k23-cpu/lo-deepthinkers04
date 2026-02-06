import { useState, useCallback } from 'react';
import { Upload as UploadIcon, FileText, X, CheckCircle2, Loader2, Sparkles } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  status: 'uploading' | 'processing' | 'complete' | 'error';
  progress: number;
}

const Upload = () => {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const processFile = (file: File) => {
    const uploadedFile: UploadedFile = {
      id: Date.now().toString(),
      name: file.name,
      size: file.size,
      status: 'uploading',
      progress: 0,
    };

    setFiles((prev) => [...prev, uploadedFile]);

    // Simulate upload progress
    let progress = 0;
    const uploadInterval = setInterval(() => {
      progress += 10;
      setFiles((prev) =>
        prev.map((f) =>
          f.id === uploadedFile.id ? { ...f, progress } : f
        )
      );

      if (progress >= 100) {
        clearInterval(uploadInterval);
        setFiles((prev) =>
          prev.map((f) =>
            f.id === uploadedFile.id ? { ...f, status: 'processing' } : f
          )
        );

        // Simulate processing
        setTimeout(() => {
          setFiles((prev) =>
            prev.map((f) =>
              f.id === uploadedFile.id ? { ...f, status: 'complete' } : f
            )
          );
          toast.success(`"${file.name}" processed and ready for analysis`);
        }, 2000);
      }
    }, 200);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
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
  }, []);

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
    <DashboardLayout>
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-serif text-3xl font-bold text-foreground mb-2">
          Upload PDF
        </h1>
        <p className="text-muted-foreground">
          Import research papers from your collection
        </p>
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
              className={`relative border-2 border-dashed rounded-xl p-12 text-center transition-colors ${
                isDragging
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

      {/* Generate Summary CTA */}
      {files.some((f) => f.status === 'complete') && (
        <Card className="glass-card border-border/50 mt-6">
          <CardContent className="flex items-center justify-between p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-primary flex items-center justify-center glow-primary">
                <Sparkles className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Ready for Analysis</h3>
                <p className="text-sm text-muted-foreground">
                  Generate AI summaries and extract insights from uploaded papers
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <Button variant="outline">Save to Workspace</Button>
              <Button variant="gradient">Generate AI Summary</Button>
            </div>
          </CardContent>
        </Card>
      )}
    </DashboardLayout>
  );
};

export default Upload;
