export type GoogleMapsLatLng = {
  lat: number;
  lng: number;
};

export type GoogleMapsGeocodingResult = {
  formatted_address: string;
  geometry: {
    location: GoogleMapsLatLng;
  };
};

export type GoogleMapsGeocodingResponse = {
  results?: GoogleMapsGeocodingResult[];
  status: string;
};

export type GoogleMapsLocationResult = {
  formattedAddress: string;
  location: {
    latitude: number;
    longitude: number;
  };
  displayName: {
    text: string;
    languageCode: string;
  };
};

export type GoogleMapsQueryResult = {
  status: string;
  places: GoogleMapsLocationResult[];
};
