import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Filesystem, Directory } from '@capacitor/filesystem';
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
  useIonLoading,
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
  const [present, dismiss] = useIonLoading();

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

  const handleDownload = async (pdfId, filename) => {
    try {
      await present({
        message: 'Downloading PDF...',
        duration: 0
      });

      const baseUrl = isPlatform('hybrid') ? API_URL : WEB_URL;
      const response = await fetch(`${baseUrl}/api/download-pdf/${pdfId}`);
      
      if (!response.ok) {
        throw new Error('Failed to download PDF');
      }

      const blob = await response.blob();
      
      if (isPlatform('hybrid')) {
        try {
          // Convert blob to base64
          const reader = new FileReader();
          const base64Data = await new Promise((resolve, reject) => {
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          });

          // Remove the data URL prefix to get just the base64 string
          const base64String = base64Data.split(',')[1];

          // Save file to device
          const savedFile = await Filesystem.writeFile({
            path: `${filename}.pdf`,
            data: base64String,
            directory: Directory.Documents,
            recursive: true
          });

          setToastMessage('PDF saved to Documents folder');
          setShowToast(true);

        } catch (error) {
          console.error('Mobile save error:', error);
          throw new Error('Failed to save PDF on device');
        }
      } else {
        // Web browser download
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${filename || 'download'}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

        setToastMessage('PDF downloaded successfully');
        setShowToast(true);
      }
    } catch (error) {
      console.error('Download error:', error);
      setToastMessage(`Failed to download PDF: ${error.message}`);
      setShowToast(true);
    } finally {
      await dismiss();
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
                            onClick={() => handleDownload(pdf._id, pdf.title)}
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
          color={toastMessage.includes('success') ? 'success' : 'danger'}
        />
      </IonContent>
    </IonPage>
  );
};

export default Dashboard;
