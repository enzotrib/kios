import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head } from "@inertiajs/react";
import { Dialog, DialogContent,  Grid, TextField } from '@mui/material';
import browserImageCompression from 'browser-image-compression';
import dayjs from 'dayjs';
import axios from "axios";
import { useState, useEffect } from "react";
import { t } from '@/i18n';

export default function Media({ images, settings }) {
    const [uploading, setUploading] = useState(false);
    const [imageOpen, setImageOpen] = useState(false);
    const [selectedImage, setSelectedImage] = useState(null);
    const [settingsData, setSettings] = useState(null);

    useEffect(() => {
        try {
            const parsedSettings = JSON.parse(settings);
            setSettings(parsedSettings);
        } catch (error) {
            console.error("Failed to parse settings:", error);
        }
    }, [settings]);

    const handleClickImageOpen = (image) => {
        setSelectedImage(image);
        setImageOpen(true);
    };

    const handleImageClose = () => {
        setImageOpen(false);
        setSelectedImage(null);
    };

    const fetchImageAsBlob = async (imageUrl) => {
        try {
            const response = await axios.get(imageUrl, { responseType: 'blob' });
            return response.data; // This is the Blob object
        } catch (error) {
            console.error('Error fetching image:', error);
            throw new Error('Failed to fetch image');
        }
    };

    const handleOptimizeImage = async (image) => {
        try {
            // Fetch the image as a Blob from the URL
            const imageBlob = await fetchImageAsBlob(image.path);

            const options = {
                maxSizeMB: (settingsData && settingsData.optimize_image_size) || 0.5,  // Set maximum file size (1MB in this case)
                maxWidthOrHeight: (settingsData && settingsData.optimize_image_width) || 720,  // Resize to max width/height of 800px
                useWebWorker: true,  // Use web worker for better performance
            };

            const compressedImage = await browserImageCompression(imageBlob, options);
            handleUploadImage(compressedImage, image);
        } catch (error) {
            console.error('Image compression failed:', error);
        }
    };

    const handleUploadImage = async (imageFile, image) => {
        setUploading(true);

        const formData = new FormData();
        formData.append('image', imageFile);
        formData.append('original_image', image.path);
        formData.append('attachment_id', image.id);

        try {
            const response = await axios.post('/optimize-image', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            if (response.status === 200) {
                alert('Image uploaded successfully!');
                console.log('Server response:', response.data);
            } else {
                alert('Failed to upload image');
            }
        } catch (error) {
            console.error('Upload failed:', error);
            alert('Error uploading image');
        }

        setUploading(false);
    };


    return (
        <AuthenticatedLayout>
            <Head title={t("Media Library")} />
            <div style={{ display: 'flex', justifyContent: 'center' }}>
                <div className="media-grid" style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '10px' }}>
                    {images && images.length > 0 ? (
                        images.map((image, index) => (
                            <div
                                key={index}
                                style={{
                                    width: '180px',
                                    height: 'auto',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    border: '1px solid #ddd',
                                    borderRadius: '8px',
                                    overflow: 'hidden',
                                    textAlign: 'center',
                                    backgroundColor: 'var(--surface-2)',
                                }}
                            >
                                {/* Image */}
                                <div
                                    style={{
                                        width: '100%',
                                        height: '180px',
                                        overflow: 'hidden',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        cursor: 'pointer',
                                    }}
                                    onClick={() => handleClickImageOpen(image.path)}
                                >
                                    <img
                                        src={image.path}
                                        alt={`Media ${index + 1}`}
                                        style={{
                                            width: '100%',
                                            height: '100%',
                                            objectFit: 'cover', // Ensures the image covers the container
                                        }}
                                        loading="lazy"
                                    />
                                </div>

                                {/* File Info */}
                                <div style={{ padding: '7px', fontSize: '12px', textAlign: 'center', overflow: 'hidden', width: '100%' }}>
                                    <p style={{ margin: 0 }}>{image.file_name}</p>
                                    <p style={{ margin: 0, color: '#555' }}>{image.size}</p>
                                    <p style={{ margin: 0, color: '#999', fontSize: '10px' }}>
                                        {dayjs(image.created_at).format('DD/MM/YYYY h:mm A')}
                                    </p>
                                </div>

                                {/* Optimize and Upload Button */}
                                <div style={{ padding: '5px', textAlign: 'center' }}>
                                    <button
                                        onClick={() => handleOptimizeImage(image)}
                                        disabled={uploading}
                                        style={{
                                            backgroundColor: 'var(--success)',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '4px',
                                            padding: '5px 5px',
                                            cursor: 'pointer',
                                            fontSize: '10px',
                                        }}
                                    >
                                        {uploading ? 'Uploading...' : 'Optimize & Upload'}
                                    </button>
                                </div>
                            </div>
                        ))
                    ) : (
                        <p>{t("No images found.")}</p>
                    )}
                </div>
            </div>

            <Dialog
                open={imageOpen}
                onClose={handleImageClose}
                maxWidth="md"
                fullWidth
            >
                <DialogContent>
                    {selectedImage && (
                        <img
                            src={selectedImage}
                            alt={t("Selected Media")}
                            style={{
                                width: '100%',
                                height: '100%',
                            }}
                        />
                    )}
                </DialogContent>
            </Dialog>

        </AuthenticatedLayout>
    );
}
