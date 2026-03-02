import React from "react";

interface OneMapProps {
  lat: number;
  lng: number;
  zoom?: number;
  mapStyle?: string;
  width?: string | number;
  height?: string | number;
  // extra parameters to append to the url (encoded HTML popup etc)
  extraParams?: string;
}

export const OneMap: React.FC<OneMapProps> = ({
  lat,
  lng,
  zoom = 15,
  mapStyle = "Default",
  width = "100%",
  height = "100%",
  extraParams = "",
}) => {
  // build the embed URL; the OneMap minimap supports a few query params
  const base = "https://www.onemap.gov.sg/minimap/minimap.html";
  const params = new URLSearchParams({
    mapStyle,
    zoomLevel: zoom.toString(),
    latLng: `${lat},${lng}`,
    showPopup: "true",
    popupWidth: "200",
  });
  if (extraParams) {
    params.append("ewt", extraParams);
  }

  const src = `${base}?${params.toString()}`;

  return (
    <iframe
      title="OneMap"
      src={src}
      width={width}
      height={height}
      className="border-0"
      allowFullScreen
    />
  );
};
