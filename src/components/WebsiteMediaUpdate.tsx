"use client";
import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  CircularProgress,
  Grid,
  Card,
  CardMedia,
  CardActions,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tabs,
  Tab,
  Alert,
  Chip,
  TextField
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import RefreshIcon from '@mui/icons-material/Refresh';
import EditIcon from '@mui/icons-material/Edit';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import SaveIcon from '@mui/icons-material/Save';
import ReorderIcon from '@mui/icons-material/Reorder';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

interface S3Image {
  key: string;
  url: string;
  lastModified: string;
  size: number;
}

interface TabPanelProps {
  children?: React.ReactNode;
  value: number;
  index: number;
}

const LAMBDA_URLS = {
  list: 'https://erwcwgoqhvtfewcouwhy4mn3ji0boorn.lambda-url.us-east-1.on.aws/',
  upload: 'https://c6rzh6uqah5otwehpaluj42qge0mtabs.lambda-url.us-east-1.on.aws/',
  delete: 'https://3t7ubs3old7rtklcp34t6x3u4y0ckcym.lambda-url.us-east-1.on.aws/',
  rename: 'https://jbyxnzprsjlssaiz3i624l3f3e0kycvd.lambda-url.us-east-1.on.aws/'
};

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`folder-tabpanel-${index}`}
      aria-labelledby={`folder-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

const WebsiteMediaUpdate: React.FC = () => {
  const [username, setUsername] = useState<string>('');
  const [currentTab, setCurrentTab] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [uploading, setUploading] = useState<boolean>(false);
  const [reorderMode, setReorderMode] = useState<boolean>(false);
  const [savingOrder, setSavingOrder] = useState<boolean>(false);
  
  const [eventsImages, setEventsImages] = useState<S3Image[]>([]);
  const [carouselImages, setCarouselImages] = useState<S3Image[]>([]);
  const [galleryImages, setGalleryImages] = useState<S3Image[]>([]);
  
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false);
  const [imageToDelete, setImageToDelete] = useState<{ key: string; folder: string } | null>(null);
  
  const [renameDialogOpen, setRenameDialogOpen] = useState<boolean>(false);
  const [imageToRename, setImageToRename] = useState<{ key: string; folder: string; currentName: string } | null>(null);
  const [newFileName, setNewFileName] = useState<string>('');
  const [renaming, setRenaming] = useState<boolean>(false);

  const folders = [
    { name: 'Events', path: 'assets/events/', state: eventsImages, setState: setEventsImages },
    { name: 'Carousel', path: 'assets/carousel/', state: carouselImages, setState: setCarouselImages },
    { name: 'Gallery', path: 'assets/gallery/', state: galleryImages, setState: setGalleryImages }
  ];

  useEffect(() => {
    const email = getCookie('email');
    if (email) {
      setUsername(email);
    }
  }, []);

  useEffect(() => {
    loadImages(folders[currentTab].path);
    setReorderMode(false);
  }, [currentTab]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
  };

  const loadImages = async (folderPath: string) => {
    setLoading(true);
    try {
      const response = await fetch(LAMBDA_URLS.list, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ folder: folderPath }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to load images');
      }

      const data = await response.json();
      const currentFolder = folders[currentTab];
      currentFolder.setState(data.images || []);
      
      toast.success(`Loaded ${data.count || 0} images from ${currentFolder.name}`);
      
    } catch (err: any) {
      console.error('Error loading images:', err);
      toast.error(err.message || 'Failed to load images');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const currentFolder = folders[currentTab];
    setUploading(true);

    let successCount = 0;
    let errorCount = 0;

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        if (!file.type.startsWith('image/')) {
          toast.error(`${file.name} is not an image file`);
          errorCount++;
          continue;
        }

        if (file.size > 10 * 1024 * 1024) {
          toast.error(`${file.name} is too large (max 10MB)`);
          errorCount++;
          continue;
        }

        const formData = new FormData();
        formData.append('file', file);
        formData.append('folder', currentFolder.path);

        try {
          const response = await fetch(LAMBDA_URLS.upload, {
            method: 'POST',
            body: formData,
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `Failed to upload ${file.name}`);
          }

          successCount++;
          toast.success(`${file.name} uploaded successfully`);
        } catch (uploadErr: any) {
          console.error(`Error uploading ${file.name}:`, uploadErr);
          toast.error(`Failed to upload ${file.name}: ${uploadErr.message}`);
          errorCount++;
        }
      }

      if (successCount > 0) {
        toast.info(`Upload complete: ${successCount} succeeded, ${errorCount} failed`);
      }

      await loadImages(currentFolder.path);
      
    } catch (err: any) {
      console.error('Error during file upload:', err);
      toast.error(err.message || 'Failed to upload files');
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
    setDragOverIndex(index);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === dropIndex) return;

    const currentFolder = folders[currentTab];
    const images = [...currentFolder.state];
    const draggedImage = images[draggedIndex];

    images.splice(draggedIndex, 1);
    images.splice(dropIndex, 0, draggedImage);

    currentFolder.setState(images);
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const toggleReorderMode = () => {
    setReorderMode(!reorderMode);
  };

  const saveOrder = async () => {
    const currentFolder = folders[currentTab];
    const images = currentFolder.state;

    if (images.length === 0) {
      toast.error('No images to reorder');
      return;
    }

    setSavingOrder(true);

    try {
      let successCount = 0;
      let errorCount = 0;

      for (let i = 0; i < images.length; i++) {
        const image = images[i];
        const oldKey = image.key;
        const fileName = oldKey.split('/').pop() || '';
        
        // Remove existing numeric prefix if present (e.g., "001_", "02-", etc.)
        const cleanFileName = fileName.replace(/^\d+[-_\s]*/, '');
        
        // Create new filename with padded number (001, 002, etc.)
        const paddedNumber = String(i + 1).padStart(3, '0');
        const newFileName = `${paddedNumber}_${cleanFileName}`;

        // Skip if filename hasn't changed
        if (fileName === newFileName) {
          successCount++;
          continue;
        }

        try {
          const response = await fetch(LAMBDA_URLS.rename, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
              oldKey: oldKey,
              newName: newFileName
            }),
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to rename image');
          }

          successCount++;
        } catch (renameErr: any) {
          console.error(`Error renaming ${fileName}:`, renameErr);
          errorCount++;
        }
      }

      if (errorCount === 0) {
        toast.success(`Successfully reordered ${successCount} images!`);
      } else {
        toast.warning(`Reordered ${successCount} images, ${errorCount} failed`);
      }

      // Reload images to show new names
      await loadImages(currentFolder.path);
      setReorderMode(false);

    } catch (err: any) {
      console.error('Error saving order:', err);
      toast.error('Failed to save order');
    } finally {
      setSavingOrder(false);
    }
  };

  const handleRenameClick = (imageKey: string, folderPath: string) => {
    const currentName = imageKey.split('/').pop() || '';
    setImageToRename({ key: imageKey, folder: folderPath, currentName });
    setNewFileName(currentName);
    setRenameDialogOpen(true);
  };

  const handleRenameConfirm = async () => {
    if (!imageToRename || !newFileName.trim()) return;

    if (newFileName === imageToRename.currentName) {
      toast.info('New filename is the same as the current filename');
      setRenameDialogOpen(false);
      return;
    }

    const invalidChars = /[<>:"/\\|?*]/;
    if (invalidChars.test(newFileName)) {
      toast.error('Filename contains invalid characters');
      return;
    }

    setRenaming(true);
    try {
      const response = await fetch(LAMBDA_URLS.rename, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          oldKey: imageToRename.key,
          newName: newFileName.trim()
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to rename image');
      }

      toast.success(`Image renamed successfully to ${newFileName}`);
      await loadImages(folders[currentTab].path);
      
    } catch (err: any) {
      console.error('Error renaming image:', err);
      toast.error(err.message || 'Failed to rename image');
    } finally {
      setRenaming(false);
      setRenameDialogOpen(false);
      setImageToRename(null);
      setNewFileName('');
    }
  };

  const handleRenameCancel = () => {
    setRenameDialogOpen(false);
    setImageToRename(null);
    setNewFileName('');
  };

  const handleDeleteClick = (imageKey: string, folderPath: string) => {
    setImageToDelete({ key: imageKey, folder: folderPath });
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
  if (!imageToDelete) return;

  try {
    const url = new URL(LAMBDA_URLS.delete);
    url.searchParams.set('key', imageToDelete.key); // <-- pass key via query string

    const response = await fetch(url.toString(), {
      method: 'DELETE',
      // no headers, no body
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to delete image');
    }

    toast.success('Image deleted successfully');
    await loadImages(folders[currentTab].path);
  } catch (err: any) {
    console.error('Error deleting image:', err);
    toast.error(err.message || 'Failed to delete image');
  } finally {
    setDeleteDialogOpen(false);
    setImageToDelete(null);
  }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setImageToDelete(null);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Box sx={{ maxWidth: 1400, mx: 'auto' }}>
      <Typography variant="h5" gutterBottom sx={{ mb: 2 }}>
        Website Media Management
      </Typography>
      
      {username && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Logged in as: <strong>{username}</strong>
        </Typography>
      )}

      <Alert severity="info" sx={{ mb: 3 }}>
        Manage images for your website. Upload new images, rename, delete, or reorder them.
        <br />
        <strong>Reorder Mode:</strong> Drag and drop images to reorder them, then click "Save Order" to apply numeric prefixes (001_, 002_, etc.).
        <br />
        <strong>Note:</strong> Maximum file size is 10MB per image.
      </Alert>

      <Paper elevation={3} sx={{ p: 3 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
          <Tabs value={currentTab} onChange={handleTabChange}>
            <Tab label="Events" />
            <Tab label="Carousel" />
            <Tab label="Gallery" />
          </Tabs>
        </Box>

        {folders.map((folder, index) => (
          <TabPanel key={index} value={currentTab} index={index}>
            <Box sx={{ mb: 3, display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
              {!reorderMode ? (
                <>
                  <Button
                    component="label"
                    variant="contained"
                    startIcon={<CloudUploadIcon />}
                    disabled={uploading || loading}
                  >
                    {uploading ? 'Uploading...' : 'Upload Images'}
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      hidden
                      onChange={handleFileUpload}
                    />
                  </Button>
                  
                  <Button
                    variant="outlined"
                    startIcon={<RefreshIcon />}
                    onClick={() => loadImages(folder.path)}
                    disabled={loading || uploading}
                  >
                    Refresh
                  </Button>

                  <Button
                    variant="outlined"
                    startIcon={<ReorderIcon />}
                    onClick={toggleReorderMode}
                    disabled={loading || uploading || folder.state.length === 0}
                    color="secondary"
                  >
                    Reorder Images
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="contained"
                    startIcon={<SaveIcon />}
                    onClick={saveOrder}
                    disabled={savingOrder}
                    color="success"
                  >
                    {savingOrder ? 'Saving...' : 'Save Order'}
                  </Button>
                  
                  <Button
                    variant="outlined"
                    onClick={toggleReorderMode}
                    disabled={savingOrder}
                  >
                    Cancel
                  </Button>

                  <Alert severity="warning" sx={{ flex: 1 }}>
                    Drag and drop images to reorder them. Click "Save Order" when done.
                  </Alert>
                </>
              )}

              <Chip 
                label={`${folder.state.length} image${folder.state.length !== 1 ? 's' : ''}`} 
                color="primary" 
                variant="outlined"
              />
            </Box>

            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                <CircularProgress />
              </Box>
            ) : folder.state.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 8 }}>
                <Typography variant="h6" color="text.secondary">
                  No images in this folder
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Upload images to get started
                </Typography>
              </Box>
            ) : (
              <Grid container spacing={3}>
                {folder.state.map((image, imgIndex) => (
                  <Grid item xs={12} sm={6} md={4} lg={3} key={image.key}>
                    <Card
                      draggable={reorderMode}
                      onDragStart={(e) => reorderMode && handleDragStart(e, imgIndex)}
                      onDragOver={(e) => reorderMode && handleDragOver(e, imgIndex)}
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => reorderMode && handleDrop(e, imgIndex)}
                      onDragEnd={handleDragEnd}
                      sx={{
                        cursor: reorderMode ? 'move' : 'default',
                        opacity: draggedIndex === imgIndex ? 0.5 : 1,
                        border: dragOverIndex === imgIndex ? '2px dashed #1976d2' : 'none',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      {reorderMode && (
                        <Box sx={{ 
                          bgcolor: 'primary.main', 
                          color: 'white', 
                          p: 1, 
                          display: 'flex', 
                          alignItems: 'center',
                          justifyContent: 'space-between'
                        }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <DragIndicatorIcon />
                            <Typography variant="body2">Drag to reorder</Typography>
                          </Box>
                          <Chip label={`#${imgIndex + 1}`} size="small" sx={{ bgcolor: 'white', color: 'primary.main' }} />
                        </Box>
                      )}
                      <CardMedia
                        component="img"
                        height="200"
                        image={image.url}
                        alt={image.key}
                        sx={{ objectFit: 'cover' }}
                      />
                      <Box sx={{ p: 2 }}>
                        <Typography variant="body2" noWrap sx={{ mb: 1 }} title={image.key.split('/').pop()}>
                          {image.key.split('/').pop()}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" display="block">
                          {formatFileSize(image.size)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" display="block">
                          {formatDate(image.lastModified)}
                        </Typography>
                      </Box>
                      {!reorderMode && (
                        <CardActions sx={{ justifyContent: 'space-between' }}>
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => handleRenameClick(image.key, folder.path)}
                            aria-label="rename"
                            title="Rename"
                          >
                            <EditIcon />
                          </IconButton>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleDeleteClick(image.key, folder.path)}
                            aria-label="delete"
                            title="Delete"
                          >
                            <DeleteIcon />
                          </IconButton>
                        </CardActions>
                      )}
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
          </TabPanel>
        ))}
      </Paper>

      <Dialog open={renameDialogOpen} onClose={handleRenameCancel} maxWidth="sm" fullWidth>
        <DialogTitle>Rename Image</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Current name: <strong>{imageToRename?.currentName}</strong>
          </Typography>
          <TextField
            autoFocus
            margin="dense"
            label="New filename"
            type="text"
            fullWidth
            variant="outlined"
            value={newFileName}
            onChange={(e) => setNewFileName(e.target.value)}
            disabled={renaming}
            helperText="Enter the new filename (including extension)"
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !renaming) {
                handleRenameConfirm();
              }
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleRenameCancel} disabled={renaming}>
            Cancel
          </Button>
          <Button 
            onClick={handleRenameConfirm} 
            variant="contained" 
            disabled={renaming || !newFileName.trim()}
          >
            {renaming ? <CircularProgress size={24} /> : 'Rename'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={deleteDialogOpen} onClose={handleDeleteCancel}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this image? This action cannot be undone.
          </Typography>
          {imageToDelete && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              File: <strong>{imageToDelete.key.split('/').pop()}</strong>
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default WebsiteMediaUpdate;

const getCookie = (name: string): string | null => {
  const cookies = document.cookie.split('; ');
  const cookie = cookies.find((row) => row.startsWith(name + '='));
  return cookie ? decodeURIComponent(cookie.split('=')[1]) : null;
};