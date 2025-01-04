import { useState, useEffect } from 'react';
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonTextarea,
  IonButton,
  IonIcon,
  IonSpinner,
  IonFab,
  IonFabButton,
  IonToast,
  useIonViewWillEnter,
  isPlatform,
  IonGrid,
  IonRow,
  IonCol,
  IonProgressBar,
  IonSkeletonText,
  IonModal,
  IonImg,
  IonInput,
  IonItem,
  IonLabel,
  IonAlert,
  IonButtons,
} from '@ionic/react';
import { alertController } from '@ionic/core';
import { language, download, camera } from 'ionicons/icons';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { useAuth } from '../contexts/AuthContext';
import LogoutButton from '../components/LogoutButton';
import './Translation.css';

// Use your computer's IP address when testing with live reload
const API_URL = 'http://192.168.12.199:3000';
const WEB_URL = 'http://localhost:3000';

const Translation = () => {
  const [banglishText, setBanglishText] = useState('');
  const [banglaText, setBanglaText] = useState('');
  const [isConverting, setIsConverting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [wordCount, setWordCount] = useState(0);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [loadingText, setLoadingText] = useState('');
  const [capturedImage, setCapturedImage] = useState('');
  const [showImagePreview, setShowImagePreview] = useState(false);
  const { currentUser } = useAuth();

  useEffect(() => {
    const words = banglishText.trim().split(/\s+/);
    setWordCount(banglishText.trim() === '' ? 0 : words.length);
  }, [banglishText]);

  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const takePicture = async () => {
    try {
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: true,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Camera,
      });

      setCapturedImage(image.dataUrl);
      setShowImagePreview(true);
      await processImage(image.dataUrl);
    } catch (error) {
      console.error('Camera error:', error);
      setToastMessage('Failed to capture image');
      setShowToast(true);
    }
  };

  const processImage = async (dataUrl) => {
    try {
      setIsConverting(true);
      setLoadingText('Processing image...');

      // Convert base64 to blob
      const response = await fetch(dataUrl);
      const blob = await response.blob();

      // Create FormData
      const formData = new FormData();
      formData.append('image', blob, 'image.jpg');

      // Send to server
      const baseUrl = isPlatform('hybrid') ? API_URL : WEB_URL;
      const apiResponse = await fetch(`${baseUrl}/api/convert-image`, {
        method: 'POST',
        body: formData,
      });

      if (!apiResponse.ok) {
        const errorData = await apiResponse.json();
        throw new Error(errorData.error || 'Failed to process image');
      }

      const result = await apiResponse.json();
      
      // Update both Banglish and Bangla text
      setBanglishText(result.originalText);
      setBanglaText(result.convertedText);
      
      setToastMessage('Image processed successfully!');
    } catch (error) {
      console.error('Image processing error:', error);
      setToastMessage(error.message || 'Failed to process image');
    } finally {
      setIsConverting(false);
      setLoadingText('');
      setShowToast(true);
      setShowImagePreview(false);
    }
  };

  const handleConvert = async () => {
    if (!banglishText.trim()) {
      setToastMessage('Please enter some text to convert');
      setShowToast(true);
      return;
    }

    setIsConverting(true);
    setLoadingText('Converting to Bangla...');
    try {
      const baseUrl = isPlatform('hybrid') ? API_URL : WEB_URL;
      const response = await fetch(`${baseUrl}/api/convert`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          text: banglishText
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Server response:', errorText);
        throw new Error(`Conversion failed: ${response.status} ${errorText}`);
      }

      const data = await response.json();
      if (!data.convertedBangla) {
        throw new Error('Invalid response format');
      }
      
      setBanglaText(data.convertedBangla);
      setToastMessage('Conversion completed!');
    } catch (error) {
      console.error('Conversion error:', error);
      setToastMessage(`Failed to convert text: ${error.message}`);
      setBanglaText('');
    } finally {
      setIsConverting(false);
      setLoadingText('');
      setShowToast(true);
    }
  };

  const handleExport = async () => {
    if (!banglaText) {
      setToastMessage('No converted text to export');
      setShowToast(true);
      return;
    }

    if (!currentUser?.email) {
      setToastMessage('User email not found. Please try logging in again.');
      setShowToast(true);
      return;
    }

    setIsExporting(true);
    setLoadingText('Generating PDF...');

    try {
      const baseUrl = isPlatform('hybrid') ? API_URL : WEB_URL;
      const response = await fetch(`${baseUrl}/api/generate_pdf`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          text: banglaText,
          email: currentUser.email
        })
      });

      if (!response.ok) {
        throw new Error('Export failed');
      }

      const result = await response.json();
      
      if (result.success) {
        const alert = await alertController.create({
          header: 'Success!',
          message: `Your translation has been exported successfully and will be sent to ${currentUser.email}. 
                   \nTitle: ${result.data.title}
                   \nFilename: ${result.data.filename}`,
          buttons: ['OK'],
          cssClass: 'custom-alert'
        });

        await alert.present();
        setToastMessage('Export completed!');
      } else {
        throw new Error(result.error || 'Export failed');
      }
    } catch (error) {
      console.error('Export error:', error);
      setToastMessage('Failed to export. Please try again.');
    } finally {
      setIsExporting(false);
      setLoadingText('');
      setShowToast(true);
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Translation</IonTitle>
          <IonButtons slot="end">
            <LogoutButton />
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        {(isConverting || isExporting) && (
          <IonProgressBar type="indeterminate" color="primary" className="loading-progress" />
        )}
        <div className="editor-container">
          <IonGrid>
            <IonRow>
              <IonCol>
                <div className="editor-content">
                  <div className="textarea-container">
                    <IonTextarea
                      value={banglishText}
                      onIonChange={e => setBanglishText(e.detail.value)}
                      placeholder="Write your Banglish text here..."
                      rows={6}
                      className="editor-textarea"
                      disabled={isConverting}
                    />
                    <IonFab className="camera-fab">
                      <IonFabButton
                        size="small"
                        onClick={takePicture}
                        disabled={isConverting}
                      >
                        <IonIcon icon={camera} />
                      </IonFabButton>
                    </IonFab>
                  </div>
                  <div className="word-count">
                    {wordCount} {wordCount === 1 ? 'word' : 'words'}
                  </div>
                </div>
              </IonCol>
            </IonRow>
            
            <IonRow>
              <IonCol>
                <div className="editor-content">
                  {isConverting ? (
                    <div className="loading-container">
                      <IonSkeletonText 
                        animated={true}
                        className="loading-skeleton"
                      />
                      <div className="loading-text">{loadingText}</div>
                    </div>
                  ) : banglaText && (
                    <IonTextarea
                      className="editor-textarea bangla-text"
                      value={banglaText}
                      readonly
                      autoGrow={true}
                      rows={6}
                    />
                  )}
                </div>
              </IonCol>
            </IonRow>
          </IonGrid>
          
          <div className="editor-actions">
            <IonButton
              className="editor-button"
              expand="block"
              onClick={handleConvert}
              disabled={isConverting || isExporting}
            >
              {isConverting ? (
                <>
                  <IonSpinner name="crescent" />
                  <span className="loading-text">{loadingText}</span>
                </>
              ) : (
                <>
                  <IonIcon slot="start" icon={language} />
                  Convert
                </>
              )}
            </IonButton>
            {banglaText && (
              <IonButton
                className="editor-button"
                expand="block"
                color="secondary"
                onClick={handleExport}
                disabled={isConverting || isExporting}
              >
                {isExporting ? (
                  <>
                    <IonSpinner name="crescent" />
                    <span className="loading-text">{loadingText}</span>
                  </>
                ) : (
                  <>
                    <IonIcon slot="start" icon={download} />
                    Export
                  </>
                )}
              </IonButton>
            )}
          </div>
        </div>

        <IonModal isOpen={showImagePreview} onDidDismiss={() => setShowImagePreview(false)}>
          <IonHeader>
            <IonToolbar>
              <IonTitle>Image Preview</IonTitle>
              <IonButtons slot="end">
                <IonButton onClick={() => setShowImagePreview(false)}>
                  Close
                </IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>
          <IonContent className="ion-padding">
            {capturedImage && (
              <div className="image-preview">
                <img src={capturedImage} alt="Captured" />
              </div>
            )}
          </IonContent>
        </IonModal>

        <IonToast
          isOpen={showToast}
          onDidDismiss={() => setShowToast(false)}
          message={toastMessage}
          duration={2000}
          position={isPlatform('mobile') ? 'bottom' : 'top'}
        />
      </IonContent>
    </IonPage>
  );
};

export default Translation;
