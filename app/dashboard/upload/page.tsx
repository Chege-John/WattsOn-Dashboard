"use client"

import { useState } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Upload, FileSpreadsheet, Check, X, AlertCircle } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { useToast } from "@/hooks/use-toast"
import * as XLSX from 'xlsx'

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [uploadStatus, setUploadStatus] = useState<"idle" | "uploading" | "success" | "error">("idle")
  const { toast } = useToast()
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0]
      if (selectedFile.type === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
          selectedFile.type === "application/vnd.ms-excel" ||
          selectedFile.name.endsWith('.xlsx') ||
          selectedFile.name.endsWith('.xls')) {
        setFile(selectedFile)
        setUploadStatus("idle")
      } else {
        toast({
          title: "Invalid file type",
          description: "Please upload an Excel file (.xlsx or .xls)",
          variant: "destructive"
        })
      }
    }
  }
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) return
    
    setUploading(true)
    setUploadStatus("uploading")
    setProgress(0)
    
    try {
      const reader = new FileReader()
      
      reader.onload = async (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer)
          const workbook = XLSX.read(data, { type: 'array' })
          
          // Process the first sheet
          const firstSheetName = workbook.SheetNames[0]
          const worksheet = workbook.Sheets[firstSheetName]
          const jsonData = XLSX.utils.sheet_to_json(worksheet)
          
          // Simulate progress
          const interval = setInterval(() => {
            setProgress(prev => {
              if (prev >= 100) {
                clearInterval(interval)
                setUploading(false)
                setUploadStatus("success")
                
                toast({
                  title: "Upload Complete",
                  description: `Successfully processed ${jsonData.length} records from ${file.name}`,
                })
                
                return 100
              }
              return prev + 10
            })
          }, 200)
          
          // Here you would typically send the data to your backend
          console.log('Processed data:', jsonData)
          
        } catch (error) {
          console.error('Error processing file:', error)
          setUploadStatus("error")
          setUploading(false)
          
          toast({
            title: "Error processing file",
            description: "There was an error processing your Excel file. Please check the format and try again.",
            variant: "destructive"
          })
        }
      }
      
      reader.readAsArrayBuffer(file)
      
    } catch (error) {
      console.error('Error reading file:', error)
      setUploadStatus("error")
      setUploading(false)
      
      toast({
        title: "Error reading file",
        description: "There was an error reading your file. Please try again.",
        variant: "destructive"
      })
    }
  }
  
  const resetForm = () => {
    setFile(null)
    setUploadStatus("idle")
    setProgress(0)
  }
  
  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        <h1 className="text-3xl font-bold tracking-tight">Data Upload</h1>
        
        <Tabs defaultValue="upload" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="upload">Upload Data</TabsTrigger>
            <TabsTrigger value="history">Upload History</TabsTrigger>
          </TabsList>
          
          <TabsContent value="upload" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Upload KoboCollect Data</CardTitle>
                <CardDescription>
                  Import data from KoboCollect by uploading exported Excel or CSV files.
                </CardDescription>
              </CardHeader>
              <form onSubmit={handleSubmit}>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="file">Upload File</Label>
                    <div className="relative">
                      <Input 
                        id="file" 
                        type="file" 
                        accept=".xlsx,.xls" 
                        onChange={handleFileChange}
                        disabled={uploading}
                        className={uploadStatus === "success" ? "border-green-500" : ""}
                      />
                      {uploadStatus === "success" && (
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                          <Check className="h-5 w-5 text-green-500" />
                        </div>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Accepted formats: .xlsx, .xls
                    </p>
                  </div>
                  
                  {file && (
                    <div className="flex flex-col gap-2 p-4 border rounded-md bg-muted/30">
                      <div className="flex items-center gap-2">
                        <FileSpreadsheet className="h-5 w-5 text-blue-500" />
                        <span className="font-medium">{file.name}</span>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Size: {(file.size / 1024).toFixed(2)} KB
                      </div>
                    </div>
                  )}
                  
                  {uploadStatus === "uploading" && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Processing file...</span>
                        <span>{progress}%</span>
                      </div>
                      <Progress value={progress} className="h-2" />
                    </div>
                  )}
                  
                  {uploadStatus === "success" && (
                    <div className="flex items-center gap-2 p-4 bg-green-500/10 border border-green-500/30 rounded-md text-green-600 dark:text-green-400">
                      <Check className="h-5 w-5" />
                      <span>File processed successfully!</span>
                    </div>
                  )}
                  
                  {uploadStatus === "error" && (
                    <div className="flex items-center gap-2 p-4 bg-red-500/10 border border-red-500/30 rounded-md text-red-600 dark:text-red-400">
                      <AlertCircle className="h-5 w-5" />
                      <span>There was an error processing your file. Please try again.</span>
                    </div>
                  )}
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={resetForm}
                    disabled={!file || uploading}
                  >
                    <X className="mr-2 h-4 w-4" />
                    Reset
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={!file || uploading || uploadStatus === "success"}
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    {uploading ? "Processing..." : "Upload Data"}
                  </Button>
                </CardFooter>
              </form>
            </Card>
          </TabsContent>
          
          <TabsContent value="history" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Upload History</CardTitle>
                <CardDescription>
                  View previous data uploads and their status.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <div className="p-8 text-center">
                    <h3 className="text-lg font-medium">No uploads yet</h3>
                    <p className="text-sm text-muted-foreground mt-2">
                      Upload data to see your history here.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}