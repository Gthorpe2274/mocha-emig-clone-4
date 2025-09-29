import { useState, useEffect } from 'react';
import { Download, Eye, CheckCircle, AlertCircle } from 'lucide-react';
import Navigation from '@/react-app/components/Navigation';
import Footer from '@/react-app/components/Footer';
import SystemLogin from '@/react-app/components/SystemLogin';

export default function TestReports() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [testingPDF, setTestingPDF] = useState(false);
  const [testingPreview, setTestingPreview] = useState(false);
  const [pdfResult, setPdfResult] = useState<'success' | 'error' | null>(null);
  const [previewData, setPreviewData] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    // Check if user is authenticated
    const authenticated = sessionStorage.getItem('systemLoginAuthenticated') === 'true';
    console.log('TestReports auth check:', { authenticated, sessionValue: sessionStorage.getItem('systemLoginAuthenticated') });
    setIsAuthenticated(authenticated);
  }, []);

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
  };

  // If not authenticated, show login component
  if (!isAuthenticated) {
    return <SystemLogin onLoginSuccess={handleLoginSuccess} />;
  }

  const generateSamplePDF = async () => {
    setTestingPDF(true);
    setPdfResult(null);
    setErrorMessage('');
    
    try {
      console.log('Starting comprehensive PDF report generation (async job)...');
      const response = await fetch('/api/test/generate-comprehensive-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          testUser: {
            age: 35,
            job: 'Software Engineer',
            country: 'Portugal',
            city: 'Lisbon',
            monthlyBudget: 3500
          }
        })
      });

      if (!response.ok) {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const errorData = await response.json();
          const errorMessage = errorData.error || `Server error: ${response.status}`;
          throw new Error(errorMessage);
        } else {
          const errorText = await response.text();
          throw new Error(`Server error ${response.status}: ${errorText.substring(0, 200)}...`);
        }
      }

      const jobData = await response.json();
      console.log('Job started:', jobData);

      if (!jobData.success) {
        throw new Error(jobData.error || 'Failed to start report generation');
      }

      // Check if this is an immediate response or needs polling
      if (jobData.immediate && jobData.downloadToken) {
        // Report is ready immediately - download it
        console.log('Test report ready immediately! Downloading PDF...');
        
        const downloadResponse = await fetch(`/api/reports/download/${jobData.downloadToken}`);
        if (!downloadResponse.ok) {
          throw new Error('Failed to download completed report');
        }

        const blob = await downloadResponse.blob();
        const fileSize = (blob.size / 1024 / 1024).toFixed(2);
        console.log(`PDF downloaded successfully, size: ${fileSize}MB`);
        
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Test_Emigration_Report_Portugal_Lisbon_${new Date().toISOString().split('T')[0]}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        setPdfResult('success');
        return;
      }

      // Legacy fallback for job polling if not immediate
      const jobId = jobData.jobId;
      if (!jobId) {
        throw new Error('No download token or job ID provided');
      }

      const maxPollingTime = 300000; // 5 minutes max
      const pollingInterval = 5000; // 5 seconds
      const startTime = Date.now();

      console.log(`Polling job ${jobId} for completion...`);

      const pollJob = async (): Promise<void> => {
        try {
          const statusResponse = await fetch(`/api/jobs/${jobId}/status`);
          const statusData = await statusResponse.json();

          console.log(`Job status: ${statusData.status}, attempts: ${statusData.attempts}`);

          if (statusData.status === 'completed' && statusData.downloadToken) {
            // Job completed successfully - download the PDF
            console.log('Job completed! Downloading PDF...');
            
            const downloadResponse = await fetch(`/api/reports/download/${statusData.downloadToken}`);
            if (!downloadResponse.ok) {
              throw new Error('Failed to download completed report');
            }

            const blob = await downloadResponse.blob();
            const fileSize = (blob.size / 1024 / 1024).toFixed(2);
            console.log(`PDF downloaded successfully, size: ${fileSize}MB`);
            
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `Comprehensive_Test_Report_Portugal_Lisbon_${new Date().toISOString().split('T')[0]}.pdf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

            setPdfResult('success');
            return;
          } else if (statusData.status === 'failed') {
            throw new Error(`Report generation failed: ${statusData.errorMessage || 'Unknown error'}`);
          } else if (Date.now() - startTime > maxPollingTime) {
            throw new Error('Report generation timed out after 5 minutes. Please try again.');
          } else {
            // Still processing, poll again
            setTimeout(pollJob, pollingInterval);
          }
        } catch (pollError) {
          console.error('Polling error:', pollError);
          throw pollError;
        }
      };

      // Start polling
      setTimeout(pollJob, pollingInterval);

    } catch (error) {
      console.error('Error with comprehensive PDF generation:', error);
      let errorMsg = error instanceof Error ? error.message : 'Unknown error';
      
      // Provide helpful context for common errors
      if (errorMsg.includes('Failed to fetch') || errorMsg.includes('network')) {
        errorMsg += ' - Check your internet connection and try again.';
      } else if (errorMsg.includes('timeout')) {
        errorMsg = 'Report generation is taking longer than expected. This can happen during high load. Please try again in a few minutes.';
      }
      
      setErrorMessage(errorMsg);
      setPdfResult('error');
      setTestingPDF(false);
    }
  };

  const previewReport = async () => {
    setTestingPreview(true);
    setPreviewData(null);
    setErrorMessage('');
    
    try {
      console.log('Requesting report preview...');
      const response = await fetch('/api/test/preview-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });

      console.log('Preview response status:', response.status);
      console.log('Preview response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Preview API error:', errorText);
        throw new Error(`Server error ${response.status}: ${errorText}`);
      }

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const responseText = await response.text();
        console.error('Invalid response format. Response body:', responseText.substring(0, 500));
        throw new Error('Invalid response format from server. Expected JSON but received different format.');
      }

      const data = await response.json();
      console.log('Preview data received:', data);
      console.log('Preview data structure check:', {
        hasSuccess: 'success' in data,
        successValue: data.success,
        hasReport: 'report' in data,
        hasReportSections: data.report && 'sections' in data.report,
        sectionsLength: data.report?.sections?.length || 0
      });
      
      // More lenient success checking - accept if success is true or undefined (default success)
      if (data.success === false) {
        throw new Error(data.error || 'Preview generation failed');
      }

      // More lenient data validation - check for basic structure
      if (!data.report) {
        console.error('No report object in response:', data);
        throw new Error('No report data received from server');
      }
      
      if (!data.report.sections || !Array.isArray(data.report.sections)) {
        console.error('No sections array in report:', data.report);
        throw new Error('No sections data in report structure');
      }

      console.log(`✅ Preview data validation passed. Setting preview data with ${data.report.sections.length} sections`);
      setPreviewData(data);
      console.log('Report preview loaded successfully with', data.report.sections.length, 'sections');
      
    } catch (error) {
      console.error('❌ Error generating report preview:', error);
      let errorMsg = error instanceof Error ? error.message : 'Unknown error';
      
      // Provide helpful context for common errors
      if (errorMsg.includes('Failed to fetch') || errorMsg.includes('network')) {
        errorMsg += ' - Check your internet connection and try again.';
      } else if (errorMsg.includes('worker') || errorMsg.includes('restart')) {
        errorMsg += ' - The system is recovering from high load. Wait 30 seconds and try again.';
      } else if (errorMsg.includes('502') || errorMsg.includes('500')) {
        errorMsg = 'Server error occurred. The preview service may be temporarily unavailable. Please try again in a few moments.';
      }
      
      console.log('Setting error message:', errorMsg);
      setErrorMessage(errorMsg);
    } finally {
      console.log('Setting testingPreview to false');
      setTestingPreview(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <Navigation />

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Page Header */}
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Report Testing & Quality Assurance
            </h2>
            <p className="text-xl text-gray-600">
              Test PDF generation and preview report content without payment
            </p>
          </div>

          {/* Test Actions */}
          <div className="grid md:grid-cols-2 gap-8 mb-12">
            {/* PDF Generation Test */}
            <div className="bg-white/60 backdrop-blur-sm p-8 rounded-2xl border border-white/20">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Download className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Generate Full PDF Report</h3>
                <p className="text-gray-600">
                  Generate and download a test emigration report with mock content (instant download)
                </p>
              </div>

              <button
                onClick={generateSamplePDF}
                disabled={testingPDF}
                className="w-full bg-gradient-to-r from-green-600 to-blue-600 text-white py-4 rounded-lg font-semibold text-lg hover:shadow-lg transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none mb-4"
              >
                {testingPDF ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                    Generating Test Report...
                  </div>
                ) : (
                  <div className="flex items-center justify-center">
                    <Download className="w-5 h-5 mr-2" />
                    Generate Full Report PDF
                  </div>
                )}
              </button>

              {pdfResult === 'success' && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                    <span className="text-green-800 font-medium">Full emigration report PDF generated and downloaded successfully!</span>
                  </div>
                </div>
              )}

              {pdfResult === 'error' && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
                    <span className="text-red-800 font-medium">Error: {errorMessage}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Content Preview Test */}
            <div className="bg-white/60 backdrop-blur-sm p-8 rounded-2xl border border-white/20">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Eye className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Preview Report Content</h3>
                <p className="text-gray-600">
                  Generate and preview the structured report content before PDF conversion
                </p>
              </div>

              <button
                onClick={previewReport}
                disabled={testingPreview}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-4 rounded-lg font-semibold text-lg hover:shadow-lg transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none mb-4"
              >
                {testingPreview ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                    Generating Preview...
                  </div>
                ) : (
                  <div className="flex items-center justify-center">
                    <Eye className="w-5 h-5 mr-2" />
                    Preview Report Structure
                  </div>
                )}
              </button>

              {errorMessage && !previewData && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center mb-2">
                    <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
                    <span className="text-red-800 font-medium">Preview Error: {errorMessage}</span>
                  </div>
                  <div className="text-lg text-red-700 mt-2">
                    <p className="mb-2"><strong>Common solutions:</strong></p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>Try the PDF generation test instead</li>
                      <li>Check that OpenAI API key is configured</li>
                      <li>Refresh the page and try again</li>
                      <li>Check your OpenAI API account status</li>
                    </ul>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Preview Results */}
          {previewData && (
            <div className="bg-white/60 backdrop-blur-sm p-8 rounded-2xl border border-white/20 mb-8">
              <div className="flex items-center mb-6">
                <CheckCircle className="w-6 h-6 text-green-500 mr-2" />
                <h3 className="text-2xl font-bold text-gray-900">Report Preview Generated Successfully</h3>
              </div>

              {/* Debug Info for Raw Data */}
              <div className="bg-gray-100 border border-gray-300 rounded-lg p-4 mb-6">
                <h4 className="font-semibold text-gray-900 mb-2">🔧 Debug Info</h4>
                <div className="text-sm text-gray-700">
                  <p><strong>Data exists:</strong> {previewData ? 'Yes' : 'No'}</p>
                  <p><strong>Report exists:</strong> {previewData?.report ? 'Yes' : 'No'}</p>
                  <p><strong>Sections exist:</strong> {previewData?.report?.sections ? 'Yes' : 'No'}</p>
                  <p><strong>Sections count:</strong> {previewData?.report?.sections?.length || 0}</p>
                  <p><strong>Stats exist:</strong> {previewData?.stats ? 'Yes' : 'No'}</p>
                  <p><strong>Executive Summary type:</strong> {typeof previewData?.report?.executiveSummary}</p>
                </div>
              </div>

              {/* Debug Info */}
              {previewData.mode && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                  <p className="text-blue-800">
                    <strong>Mode:</strong> {previewData.mode} | 
                    <strong> Success:</strong> {previewData.success ? 'Yes' : 'No'} | 
                    <strong> Emergency:</strong> {previewData.emergency ? 'Yes' : 'No'}
                  </p>
                  {previewData.note && (
                    <p className="text-blue-700 text-sm mt-2">{previewData.note}</p>
                  )}
                </div>
              )}

              {/* Report Stats */}
              {previewData.stats && (
                <div className="grid md:grid-cols-3 gap-4 mb-8">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-blue-600">{previewData.stats.totalSections}</div>
                    <div className="text-lg text-blue-700">Total Sections</div>
                  </div>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-green-600">{previewData.stats.totalCharacters.toLocaleString()}</div>
                    <div className="text-lg text-green-700">Total Characters</div>
                  </div>
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-purple-600">{previewData.stats.averageSectionLength.toLocaleString()}</div>
                    <div className="text-lg text-purple-700">Avg Section Length</div>
                  </div>
                </div>
              )}

              {/* Report Metadata */}
              {previewData.report && (
                <div className="bg-gray-50 rounded-lg p-6 mb-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Report Metadata</h4>
                  <div className="grid md:grid-cols-2 gap-4 text-lg">
                    <div><strong>Title:</strong> {previewData.report.title}</div>
                    <div><strong>Country:</strong> {previewData.report.country}</div>
                    <div><strong>City:</strong> {previewData.report.city || 'N/A'}</div>
                    <div><strong>Generated:</strong> {new Date(previewData.report.generatedAt).toLocaleString()}</div>
                  </div>
                </div>
              )}

              {/* Executive Summary */}
              {previewData.report?.executiveSummary && (
                <div className="mb-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-3">Executive Summary</h4>
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="text-sm text-gray-600 mb-3">
                      Length: {previewData.report.executiveSummary.length || previewData.report.executiveSummary?.preview?.length || 'N/A'} characters
                    </div>
                    <div className="text-gray-800 leading-relaxed whitespace-pre-line">
                      {previewData.report.executiveSummary.preview || previewData.report.executiveSummary || 'No executive summary content available'}
                    </div>
                  </div>
                </div>
              )}

              {/* Sections Overview */}
              {previewData.report?.sections && previewData.report.sections.length > 0 && (
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Section Overview</h4>
                  <div className="space-y-4">
                    {previewData.report.sections.map((section: any, index: number) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h5 className="font-semibold text-gray-900">{section.title}</h5>
                          <div className="flex items-center space-x-2 text-lg text-gray-600">
                            <span>{(section.contentLength || 0).toLocaleString()} chars</span>
                            {section.hasSubsections && (
                              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                {section.subsectionCount || 0} subsections
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="text-sm text-gray-700 bg-gray-50 rounded p-3 leading-relaxed">
                          {section.preview || section.content || 'No preview available'}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Fallback message if no content */}
              {(!previewData.report || !previewData.report.sections || previewData.report.sections.length === 0) && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                  <p className="text-yellow-800">
                    Preview data structure is incomplete. This might be due to a server issue or the emergency fallback being activated.
                  </p>
                  <p className="text-yellow-700 text-sm mt-2">
                    Try refreshing the page or use the PDF generation test instead.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Instructions */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200 rounded-2xl p-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">📋 Testing Instructions</h3>
            <div className="space-y-4 text-gray-700">
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-lg font-bold mt-0.5">1</div>
                <div>
                  <strong>Generate Full PDF Report:</strong> Click the "Generate Full Report PDF" button to create a comprehensive emigration report with real AI-generated content. This uses our new multi-stage processing system to create the most detailed and accurate reports possible.
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-purple-500 text-white rounded-full flex items-center justify-center text-lg font-bold mt-0.5">2</div>
                <div>
                  <strong>Preview Content:</strong> Use "Preview Report Structure" to see the generated content structure, section lengths, and quality without downloading a PDF.
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-lg font-bold mt-0.5">3</div>
                <div>
                  <strong>Review Quality:</strong> Check that each section has substantial content (1000+ characters), covers the topic comprehensively, and maintains professional quality.
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-orange-500 text-white rounded-full flex items-center justify-center text-lg font-bold mt-0.5">4</div>
                <div>
                  <strong>Test PDF Quality:</strong> Open the downloaded PDF (typically 2-5MB, 20+ pages) and verify formatting, readability, page breaks, and comprehensive content coverage across all emigration topics.
                </div>
              </div>
            </div>
            
            <div className="mt-6 space-y-4">
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-lg text-green-800">
                  <strong>⚡ Ultra-Efficient Processing:</strong> Reports now use an optimized 2-stage generation process that minimizes OpenAI API calls while maintaining high quality. Perfect for free OpenAI accounts with rate limits.
                </p>
              </div>
              
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h5 className="font-semibold text-blue-800 mb-2">🎯 Streamlined Generation Process</h5>
                <div className="text-lg text-blue-600 space-y-2">
                  <p><strong>Stage 1:</strong> Complete report generation in single AI call (all sections + executive summary)</p>
                  <p><strong>Stage 2:</strong> PDF conversion and finalization</p>
                  <p className="mt-3 text-blue-800"><strong>Total:</strong> Only 1-2 OpenAI API calls (down from 20+)</p>
                </div>
              </div>
              
              <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                <h5 className="font-semibold text-purple-800 mb-2">🔧 Rate Limit Optimizations</h5>
                <div className="text-lg text-purple-600">
                  <p>• Compatible with OpenAI free tier (3 requests/minute limit)</p>
                  <p>• Reduces API costs by 90%+ compared to previous approach</p>
                  <p>• Maintains comprehensive 8-section report structure</p>
                  <p>• Graceful fallback for rate limit errors</p>
                  <p>• Uses GPT-4o-mini for cost efficiency</p>
                </div>
              </div>
              
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <h5 className="font-semibold text-yellow-800 mb-2">💡 Best Practices for Free Accounts</h5>
                <div className="text-lg text-yellow-600">
                  <p>• Wait 30 seconds between test attempts to avoid rate limits</p>
                  <p>• Free OpenAI accounts allow 3 requests per minute</p>
                  <p>• Each report generation uses 1-2 of your monthly quota</p>
                  <p>• Preview mode uses zero API calls (static content)</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
