'use client'

import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useEffect, useCallback } from 'react'

const PinIcon = L.icon({
  iconUrl: '/marker-icon.png',
  iconRetinaUrl: '/marker-icon-2x.png',
  shadowUrl: '/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
})

function MapFixer() {
  const map = useMap()
  const fix = useCallback(() => map.invalidateSize({ animate: false }), [map])
  useEffect(() => {
    const timers = [50, 200, 500].map((d) => setTimeout(fix, d))
    const ro = new ResizeObserver(fix)
    ro.observe(map.getContainer())
    return () => {
      timers.forEach(clearTimeout)
      ro.disconnect()
    }
  }, [map, fix])
  return null
}

function ClickHandler({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng)
    },
  })
  return null
}

function RecenterMap({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap()
  useEffect(() => {
    if (lat && lng) {
      setTimeout(() => {
        try {
          map.setView([lat, lng], map.getZoom())
        } catch {
          /* ignore */
        }
      }, 100)
    }
  }, [lat, lng, map])
  return null
}

interface PickerMapProps {
  lat: number
  lng: number
  onPick: (lat: number, lng: number) => void
}

export default function PickerMap({ lat, lng, onPick }: PickerMapProps) {
  const defaultLat = lat || 14.5995
  const defaultLng = lng || 120.9842

  return (
    <MapContainer
      center={[defaultLat, defaultLng]}
      zoom={15}
      style={{ height: '100%', width: '100%' }}
      scrollWheelZoom
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <MapFixer />
      <ClickHandler onPick={onPick} />
      {lat && lng && (
        <>
          <RecenterMap lat={lat} lng={lng} />
          <Marker position={[lat, lng]} icon={PinIcon} />
        </>
      )}
    </MapContainer>
  )
}
