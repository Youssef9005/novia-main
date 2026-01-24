"use client"

import React, { useState, useRef, useCallback } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Upload, Loader2, Trash2 } from "lucide-react"
import Image from "next/image"
import { toast } from "@/hooks/use-toast"

interface UploadedImage {
  url: string;
  filename: string;
  originalName: string;
  uploadedAt: string;
}

interface ImageUploadProps {
  images?: UploadedImage[];
  onImagesChange: (images: UploadedImage[]) => void;
  maxImages?: number;
  className?: string;
}

export function ImageUpload({ 
  images = [], 
  onImagesChange, 
  maxImages = 5,
  className = "" 
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleUpload = useCallback(async (files: FileList | File[]) => {
    if (images.length >= maxImages) {
      toast({
        title: "Maximum Images Reached",
        description: `You can upload a maximum of ${maxImages} images`,
        variant: "destructive",
      })
      return
    }

    const fileArray = Array.from(files)
    const validFiles = fileArray.filter(file => {
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Invalid File Type",
          description: "Only image files are allowed",
          variant: "destructive",
        })
        return false
      }
      if (file.size > 5 * 1024 * 1024) { // 5MB
        toast({
          title: "File Too Large",
          description: "File size must be less than 5MB",
          variant: "destructive",
        })
        return false
      }
      return true
    })

    if (validFiles.length === 0) return

    setIsUploading(true)
    try {
      // Upload images to backend
      const uploadPromises = validFiles.map(async (file) => {
        const formData = new FormData();
        formData.append('image', file);
        
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.novia-ai.com'}/api/upload/single`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: formData
        });
        
        if (!response.ok) {
          throw new Error(`Upload failed: ${response.statusText}`);
        }
        
        const result = await response.json();
        return {
          url: result.data.url,
          filename: result.data.filename,
          originalName: result.data.originalName,
          uploadedAt: new Date().toISOString()
        };
      });
      
      const newImages = await Promise.all(uploadPromises);
      onImagesChange([...images, ...newImages])
      
      toast({
        title: "Images Uploaded Successfully",
        description: `${newImages.length} image(s) uploaded`,
      })
    } catch (error) {
      console.error('Upload error:', error)
      toast({
        title: "Upload Error",
        description: "An error occurred while uploading images. Please try again",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
    }
  }, [images, maxImages, onImagesChange])

  const handleDeleteImage = async (filename: string) => {
    try {
      // Delete from backend if it's not a blob URL
      if (!filename.startsWith('blob:') && !filename.startsWith('temp-')) {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.novia-ai.com'}/api/upload/${filename}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        if (!response.ok) {
          console.warn('Failed to delete image from backend:', response.statusText);
        }
      }
      
      const updatedImages = images.filter(img => img.filename !== filename)
      onImagesChange(updatedImages)
      
      toast({
        title: "Image Deleted",
        description: "Image deleted successfully",
      })
    } catch (error) {
      console.error('Delete error:', error)
      toast({
        title: "Delete Error",
        description: "An error occurred while deleting the image",
        variant: "destructive",
      })
    }
  }

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleUpload(e.dataTransfer.files)
    }
  }, [handleUpload])

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleUpload(e.target.files)
    }
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <Label>Plan Images</Label>
      
      {/* Upload Area */}
      <Card className={`border-2 border-dashed transition-colors ${
        dragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'
      }`}>
        <CardContent className="p-6">
          <div
            className="flex flex-col items-center justify-center space-y-4"
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <div className="flex flex-col items-center space-y-2">
              <Upload className="h-8 w-8 text-muted-foreground" />
              <div className="text-center">
                <p className="text-sm font-medium">
                  Drag and drop images here or{" "}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-primary hover:underline"
                    disabled={isUploading}
                  >
                    choose files
                  </button>
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  PNG, JPG, GIF up to 5MB. Maximum {maxImages} images
                </p>
              </div>
            </div>
            
            {isUploading && (
              <div className="flex items-center space-x-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">Uploading images...</span>
              </div>
            )}
          </div>
          
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            onChange={handleFileInput}
            className="hidden"
            disabled={isUploading}
          />
        </CardContent>
      </Card>

      {/* Uploaded Images */}
      {images.length > 0 && (
        <div className="space-y-3">
          <Label>Uploaded Images ({images.length}/{maxImages})</Label>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {images.map((image) => (
              <Card key={image.filename} className="relative group">
                <CardContent className="p-2">
                  <div className="relative aspect-square">
                    <Image
                      src={image.url}
                      alt={image.originalName}
                      fill
                      className="object-cover rounded-md"
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-md flex items-center justify-center">
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteImage(image.filename)}
                        className="h-8 w-8 p-0"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 truncate">
                    {image.originalName}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )
} 