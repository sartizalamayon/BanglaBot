import React from 'react';
import { IonCard, IonProgressBar } from '@ionic/react';

const RegionMap = ({ regions, progress, onRegionSelect, isRegionUnlocked }) => {
  return (
    <div className="region-map">
      {Object.entries(regions).map(([key, region]) => {
        const isUnlocked = isRegionUnlocked(key);
        const isCompleted = progress[key]?.completed;
        
        return (
          <IonCard 
            key={key}
            className={`region-card ${!isUnlocked ? 'region-locked' : ''} ${isCompleted ? 'region-completed' : ''}`}
            onClick={() => isUnlocked && onRegionSelect(key)}
          >
            <div className="region-content">
              <div className="region-icon" style={{ color: region.color }}>
                {region.icon}
              </div>
              <h3>{region.name}</h3>
              <p>{region.description}</p>
              {!isUnlocked && (
                <div className="lock-message">
                  🔒 {regions[region.unlockRequirement].name} সম্পন্ন করুন
                </div>
              )}
              <IonProgressBar 
                value={progress[key]?.progress || 0}
                color={region.color}
              />
            </div>
          </IonCard>
        );
      })}
    </div>
  );
};

export default RegionMap;
