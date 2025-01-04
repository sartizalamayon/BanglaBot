import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonItem,
  IonLabel,
  IonIcon,
  IonGrid,
  IonRow,
  IonCol,
  IonChip,
  IonSpinner,
  IonRefresher,
  IonRefresherContent,
  isPlatform,
  IonButton,
  IonToast,
  IonSearchbar,
  IonSegment,
  IonSegmentButton,
  IonCardSubtitle,
  IonSkeletonText,
  useIonAlert,
  IonButtons,
} from '@ionic/react';
import {
  documentTextOutline,
  timeOutline,
  lockClosedOutline,
  lockOpenOutline,
  downloadOutline,
  calendarOutline,
  trendingUpOutline,
  analyticsOutline,
  documentsOutline,
} from 'ionicons/icons';
import { Filesystem, Directory } from '@capacitor/filesystem';
import LogoutButton from '../components/LogoutButton';
import './Dashboard.css';

const API_URL = 'http://192.168.12.199:3000';
const WEB_URL = 'http://localhost:3000';

const Dashboard = () => {
  const [pdfs, setPdfs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { currentUser } = useAuth();
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [searchText, setSearchText] = useState('');
  const [filter, setFilter] = useState('all');
  const [presentAlert] = useIonAlert();

  const fetchPDFs = async () => {
    if (!currentUser?.email) return;

    try {
      setLoading(true);
      const baseUrl = isPlatform('hybrid') ? API_URL : WEB_URL;
      const response = await fetch(`${baseUrl}/api/get-pdf/${encodeURIComponent(currentUser.email)}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch PDFs');
      }

      const data = await response.json();
      setPdfs(data);
    } catch (error) {
      console.error('Error fetching PDFs:', error);
      setError(error.message);
      setToastMessage('Failed to load PDFs');
      setShowToast(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPDFs();
  }, [currentUser]);

  const handleRefresh = async (event) => {
    await fetchPDFs();
    event.detail.complete();
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleDownloadPDF = async (pdf) => {
    try {
      const baseUrl = isPlatform('hybrid') ? API_URL : WEB_URL;
      const response = await fetch(`${baseUrl}/api/download-pdf/${pdf._id}`);
      
      if (!response.ok) {
        throw new Error('Failed to download PDF');
      }

      // Create filename with Bangla title
      const timestamp = new Date().toISOString()
        .replace(/[-:]/g, '')
        .split('.')[0];
      
      // Keep only Bangla characters and basic punctuation, remove any problematic characters
      const cleanTitle = pdf.title
        .trim()
        .replace(/[<>:"/\\|?*\x00-\x1F]/g, '') // Remove invalid filename characters
        .substring(0, 100); // Limit length to prevent issues
      
      const fileName = `${cleanTitle}_${timestamp}.pdf`;

      if (isPlatform('hybrid')) {
        // For mobile: Save to device storage
        const blob = await response.blob();
        const reader = new FileReader();
        
        reader.onload = async () => {
          try {
            const base64Data = reader.result.split(',')[1];
            
            // For Android, we'll save with the encoded filename
            const androidFileName = encodeURIComponent(fileName);
            
            await Filesystem.writeFile({
              path: androidFileName,
              data: base64Data,
              directory: Directory.Documents,
              recursive: true
            });

            presentAlert({
              header: 'সফল',
              message: `পিডিএফটি সফলভাবে ডাউনলোড হয়েছে!\nফাইল নাম: ${cleanTitle}`,
              buttons: ['ঠিক আছে'],
            });
          } catch (error) {
            console.error('Error saving file:', error);
            setToastMessage('পিডিএফ সংরক্ষণ করা যায়নি');
            setShowToast(true);
          }
        };

        reader.readAsDataURL(blob);
      } else {
        // For web: Use browser download with proper encoding
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        // Show success message
        setToastMessage('পিডিএফ ডাউনলোড সম্পন্ন হয়েছে');
        setShowToast(true);
      }
    } catch (error) {
      console.error('Error downloading PDF:', error);
      setToastMessage('পিডিএফ ডাউনলোড করা যায়নি');
      setShowToast(true);
    }
  };

  // Calculate statistics
  const stats = useMemo(() => {
    if (!pdfs.length) return null;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayPDFs = pdfs.filter(pdf => {
      const pdfDate = new Date(pdf.date);
      pdfDate.setHours(0, 0, 0, 0);
      return pdfDate.getTime() === today.getTime();
    });

    const privatePDFs = pdfs.filter(pdf => pdf.privacy === 'private');
    const avgTextLength = pdfs.reduce((acc, pdf) => acc + pdf.text.length, 0) / pdfs.length;

    return {
      total: pdfs.length,
      today: todayPDFs.length,
      private: privatePDFs.length,
      avgLength: Math.round(avgTextLength),
    };
  }, [pdfs]);

  // Filter and search PDFs
  const filteredPDFs = useMemo(() => {
    return pdfs
      .filter(pdf => {
        if (filter === 'private') return pdf.privacy === 'private';
        if (filter === 'public') return pdf.privacy !== 'private';
        return true;
      })
      .filter(pdf => {
        const searchLower = searchText.toLowerCase();
        return (
          pdf.title.toLowerCase().includes(searchLower) ||
          pdf.text.toLowerCase().includes(searchLower) ||
          (pdf.caption && pdf.caption.toLowerCase().includes(searchLower))
        );
      })
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [pdfs, filter, searchText]);

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Dashboard</IonTitle>
          <IonButtons slot="end">
            <LogoutButton />
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent className="dashboard-content">
        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
          <IonRefresherContent></IonRefresherContent>
        </IonRefresher>

        <IonGrid>
          {/* Statistics Cards */}
          <IonRow>
            <IonCol size="6" sizeMd="3">
              <IonCard className="stat-card">
                <IonCardContent>
                  <div className="stat-icon">
                    <IonIcon icon={documentsOutline} />
                  </div>
                  <div className="stat-value">
                    {loading ? <IonSkeletonText animated style={{ width: '40px' }} /> : stats?.total || 0}
                  </div>
                  <div className="stat-label">Total PDFs</div>
                </IonCardContent>
              </IonCard>
            </IonCol>
            <IonCol size="6" sizeMd="3">
              <IonCard className="stat-card">
                <IonCardContent>
                  <div className="stat-icon">
                    <IonIcon icon={calendarOutline} />
                  </div>
                  <div className="stat-value">
                    {loading ? <IonSkeletonText animated style={{ width: '40px' }} /> : stats?.today || 0}
                  </div>
                  <div className="stat-label">Today's PDFs</div>
                </IonCardContent>
              </IonCard>
            </IonCol>
            <IonCol size="6" sizeMd="3">
              <IonCard className="stat-card">
                <IonCardContent>
                  <div className="stat-icon">
                    <IonIcon icon={analyticsOutline} />
                  </div>
                  <div className="stat-value">
                    {loading ? <IonSkeletonText animated style={{ width: '40px' }} /> : stats?.avgLength || 0}
                  </div>
                  <div className="stat-label">Avg. Characters</div>
                </IonCardContent>
              </IonCard>
            </IonCol>
            <IonCol size="6" sizeMd="3">
              <IonCard className="stat-card">
                <IonCardContent>
                  <div className="stat-icon">
                    <IonIcon icon={lockClosedOutline} />
                  </div>
                  <div className="stat-value">
                    {loading ? <IonSkeletonText animated style={{ width: '40px' }} /> : stats?.private || 0}
                  </div>
                  <div className="stat-label">Private PDFs</div>
                </IonCardContent>
              </IonCard>
            </IonCol>
          </IonRow>

          {/* PDF List Section */}
          <IonRow>
            <IonCol size="12">
              <IonCard className="pdf-list-card">
                <IonCardHeader>
                  <IonCardTitle>Your Generated PDFs</IonCardTitle>
                  <IonCardSubtitle>
                    {filteredPDFs.length} {filteredPDFs.length === 1 ? 'PDF' : 'PDFs'} found
                  </IonCardSubtitle>
                </IonCardHeader>

                <IonCardContent>
                  {/* Search and Filter */}
                  <div className="search-filter-container">
                    <IonSearchbar
                      value={searchText}
                      onIonChange={e => setSearchText(e.detail.value)}
                      placeholder="Search PDFs..."
                      className="pdf-searchbar"
                    />
                    <IonSegment value={filter} onIonChange={e => setFilter(e.detail.value)}>
                      <IonSegmentButton value="all">
                        <IonLabel>All</IonLabel>
                      </IonSegmentButton>
                      <IonSegmentButton value="public">
                        <IonLabel>Public</IonLabel>
                      </IonSegmentButton>
                      <IonSegmentButton value="private">
                        <IonLabel>Private</IonLabel>
                      </IonSegmentButton>
                    </IonSegment>
                  </div>

                  {/* PDF List */}
                  {loading ? (
                    <div className="loading-container">
                      <IonSpinner />
                      <p>Loading PDFs...</p>
                    </div>
                  ) : error ? (
                    <div className="error-container">
                      <p>{error}</p>
                      <IonButton onClick={fetchPDFs}>Retry</IonButton>
                    </div>
                  ) : filteredPDFs.length === 0 ? (
                    <div className="empty-container">
                      <p>{searchText ? 'No PDFs match your search' : 'No PDFs generated yet'}</p>
                    </div>
                  ) : (
                    <div className="pdf-list">
                      {filteredPDFs.map((pdf) => (
                        <IonItem key={pdf._id} lines="full" className="pdf-item">
                          <IonLabel>
                            <div className="pdf-title">{pdf.title}</div>
                            <div className="pdf-text">{pdf.text}</div>
                            <div className="pdf-meta">
                              <IonChip outline color="primary" className="pdf-date">
                                <IonIcon icon={timeOutline} />
                                <IonLabel>{formatDate(pdf.date)}</IonLabel>
                              </IonChip>
                              <IonChip 
                                outline 
                                color={pdf.privacy === 'private' ? 'danger' : 'success'}
                                className="pdf-privacy"
                              >
                                <IonIcon icon={pdf.privacy === 'private' ? lockClosedOutline : lockOpenOutline} />
                                <IonLabel>{pdf.privacy || 'public'}</IonLabel>
                              </IonChip>
                            </div>
                            {pdf.caption && (
                              <div className="pdf-caption">{pdf.caption}</div>
                            )}
                          </IonLabel>
                          <IonButton 
                            slot="end" 
                            fill="clear"
                            onClick={() => handleDownloadPDF(pdf)}
                            className="download-button"
                          >
                            <IonIcon icon={downloadOutline} slot="icon-only" />
                          </IonButton>
                        </IonItem>
                      ))}
                    </div>
                  )}
                </IonCardContent>
              </IonCard>
            </IonCol>
          </IonRow>
        </IonGrid>

        <IonToast
          isOpen={showToast}
          onDidDismiss={() => setShowToast(false)}
          message={toastMessage}
          duration={3000}
          position="bottom"
          color="danger"
        />
      </IonContent>
    </IonPage>
  );
};

export default Dashboard;
