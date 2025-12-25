import React from 'react';
import { FaTimes, FaMapMarkerAlt } from 'react-icons/fa';
import { useMapContext } from '../../context/MapContext';

const LocationNote = ({ marker, onRemove, noteId, tabId, inline = false }) => {
  const { flyTo } = useMapContext();

  const handleRemove = (e) => {
    e.stopPropagation();
    onRemove(noteId, tabId, marker.id);
  };

  const handleViewOnMap = (e) => {
    e.stopPropagation();
    if (marker.coordinates && marker.coordinates.length >= 2) {
      flyTo({
        lng: marker.coordinates[0],
        lat: marker.coordinates[1],
        zoom: 16,
        duration: 1500
      });
    }
  };

  return (
    <div className={`location-note ${inline ? 'inline' : ''}`}>
      <div className="location-note-header">
        <div className="location-note-icon">
          <FaMapMarkerAlt />
        </div>
        <div className="location-note-title">
          {marker.name || 'Location Marker'}
        </div>
        <div className="location-note-actions">
          <button className="location-note-view-map" onClick={handleViewOnMap} title="Xem trên Bản đồ">
            🗺️
          </button>
          <button className="location-note-remove" onClick={handleRemove} title="Xóa marker">
            <FaTimes />
          </button>
        </div>
      </div>

      <div className="location-note-content">
        {marker.image && (
          <div className="location-note-image">
            <img
              src={marker.image}
              alt={marker.name || 'Location'}
              onError={(e) => {
                e.target.src = '/icons/location.svg';
              }}
            />
          </div>
        )}

        <div className="location-note-details">
          {marker.address && (
            <div className="location-note-address">
              <span className="label">Address:</span>
              <span className="value">{marker.address}</span>
            </div>
          )}

          {marker.description && (
            <div className="location-note-description">
              <span className="label">Description:</span>
              <span className="value">{marker.description}</span>
            </div>
          )}

          {marker.phoneNumber && (
            <div className="location-note-phone">
              <span className="label">Phone:</span>
              <span className="value">{marker.phoneNumber}</span>
            </div>
          )}

          {/*{marker.rating && (*/}
          {/*  <div className="location-note-rating">*/}
          {/*    <span className="label">Rating:</span>*/}
          {/*    <span className="value">⭐ {marker.rating}</span>*/}
          {/*  </div>*/}
          {/*)}*/}

          {(marker.openingTime || marker.closingTime) && (
            <div className="location-note-hours">
              <span className="label">Hours:</span>
              <span className="value">
                {marker.openingTime && marker.closingTime
                  ? `${marker.openingTime} - ${marker.closingTime}`
                  : marker.openingTime
                    ? `Mở cửa: ${marker.openingTime}`
                    : `Đóng cửa: ${marker.closingTime}`
                }
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LocationNote;
