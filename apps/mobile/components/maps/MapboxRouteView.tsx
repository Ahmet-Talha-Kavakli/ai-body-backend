/**
 * MapboxRouteView — premium map component for FitAI routes
 *
 * Wraps @rnmapbox/maps with our common patterns:
 * - Polyline route (with white halo + colored top)
 * - Start/End markers
 * - Optional KM markers
 * - Optional path overlay (from Overpass)
 * - Optional draggable waypoints
 * - Imperative camera API via ref
 */

import React, { forwardRef, useImperativeHandle, useMemo, useRef } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Mapbox from '@rnmapbox/maps';

export interface LatLng {
  latitude: number;
  longitude: number;
}

export type MapStyleKey = 'standard' | 'satellite' | 'hybrid' | 'outdoors' | 'dark';

const STYLE_URL: Record<MapStyleKey, string> = {
  standard: 'mapbox://styles/mapbox/standard',
  satellite: 'mapbox://styles/mapbox/standard-satellite',
  hybrid: Mapbox.StyleURL.SatelliteStreet,
  outdoors: Mapbox.StyleURL.Outdoors,
  dark: Mapbox.StyleURL.Dark,
};

export interface MapboxRouteViewRef {
  flyTo: (center: LatLng, zoom?: number, durationMs?: number) => void;
  fitToCoords: (coords: LatLng[], paddingPx?: number) => void;
  setHeading: (heading: number, durationMs?: number) => void;
  setPitch: (pitch: number, durationMs?: number) => void;
  flyAlong: (coords: LatLng[], durationMs?: number, pitch?: number) => Promise<void>;
}

interface Props {
  style?: any;
  styleKey?: MapStyleKey;
  initialCenter?: LatLng;
  initialZoom?: number;
  initialPitch?: number;
  routeCoords?: LatLng[];
  pathways?: { id: number | string; coords: LatLng[]; category: 'foot' | 'bike' | 'mixed' }[];
  pathOverlayOpacity?: number; // 0..1
  kmMarkers?: { km: number; coord: LatLng }[];
  waypoints?: LatLng[];
  showStartEnd?: boolean;
  draggableWaypoints?: boolean;
  onPress?: (c: LatLng) => void;
  onWaypointDragEnd?: (idx: number, c: LatLng) => void;
  showsUserLocation?: boolean;
  followUser?: boolean;
  attributionEnabled?: boolean;
  logoEnabled?: boolean;
  scrollEnabled?: boolean;
  zoomEnabled?: boolean;
  rotateEnabled?: boolean;
  pitchEnabled?: boolean;
  onCameraChanged?: (c: { center: LatLng; zoom: number; pitch: number; bearing: number }) => void;
}

const ACCENT = '#FF6B35';

const MapboxRouteView = forwardRef<MapboxRouteViewRef, Props>(function MapboxRouteView(props, ref) {
  const {
    style,
    styleKey = 'standard',
    initialCenter,
    initialZoom = 14,
    initialPitch = 0,
    routeCoords,
    pathways,
    pathOverlayOpacity = 0.5,
    kmMarkers,
    waypoints,
    showStartEnd = true,
    draggableWaypoints = false,
    onPress,
    onWaypointDragEnd,
    showsUserLocation = false,
    followUser = false,
    attributionEnabled = false,
    logoEnabled = false,
    scrollEnabled = true,
    zoomEnabled = true,
    rotateEnabled = true,
    pitchEnabled = true,
    onCameraChanged,
  } = props;

  const cameraRef = useRef<Mapbox.Camera>(null);

  useImperativeHandle(
    ref,
    () => ({
      flyTo: (center, zoom = 15, durationMs = 600) => {
        cameraRef.current?.setCamera({
          centerCoordinate: [center.longitude, center.latitude],
          zoomLevel: zoom,
          animationMode: 'flyTo',
          animationDuration: durationMs,
        });
      },
      fitToCoords: (coords, paddingPx = 60) => {
        if (coords.length < 2) return;
        const lats = coords.map((c) => c.latitude);
        const lons = coords.map((c) => c.longitude);
        const ne: [number, number] = [Math.max(...lons), Math.max(...lats)];
        const sw: [number, number] = [Math.min(...lons), Math.min(...lats)];
        cameraRef.current?.fitBounds(ne, sw, paddingPx, 700);
      },
      setHeading: (heading, durationMs = 250) => {
        cameraRef.current?.setCamera({ heading, animationDuration: durationMs });
      },
      setPitch: (pitch, durationMs = 600) => {
        cameraRef.current?.setCamera({ pitch, animationDuration: durationMs });
      },
      flyAlong: async (coords, durationMs = 12000, pitch = 60) => {
        if (coords.length < 2) return;
        const segments = coords.length - 1;
        const perSeg = durationMs / segments;
        for (let i = 0; i < coords.length; i++) {
          const c = coords[i];
          const next = coords[Math.min(i + 1, coords.length - 1)];
          const bearing = bearingBetween(c, next);
          await new Promise<void>((resolve) => {
            cameraRef.current?.setCamera({
              centerCoordinate: [c.longitude, c.latitude],
              zoomLevel: 16.5,
              pitch,
              heading: bearing,
              animationMode: 'easeTo',
              animationDuration: perSeg,
            });
            setTimeout(resolve, perSeg);
          });
        }
      },
    }),
    [],
  );

  // Build GeoJSON for route
  const routeGeoJSON = useMemo(() => {
    if (!routeCoords || routeCoords.length < 2) return null;
    return {
      type: 'Feature' as const,
      properties: {},
      geometry: {
        type: 'LineString' as const,
        coordinates: routeCoords.map((c) => [c.longitude, c.latitude]),
      },
    };
  }, [routeCoords]);

  // Build GeoJSON for path overlay (multi-line)
  const footGeoJSON = useMemo(() => {
    if (!pathways) return null;
    const features = pathways
      .filter((p) => p.category === 'foot' || p.category === 'mixed')
      .map((p) => ({
        type: 'Feature' as const,
        properties: { id: p.id },
        geometry: {
          type: 'LineString' as const,
          coordinates: p.coords.map((c) => [c.longitude, c.latitude]),
        },
      }));
    return features.length ? { type: 'FeatureCollection' as const, features } : null;
  }, [pathways]);

  const bikeGeoJSON = useMemo(() => {
    if (!pathways) return null;
    const features = pathways
      .filter((p) => p.category === 'bike')
      .map((p) => ({
        type: 'Feature' as const,
        properties: { id: p.id },
        geometry: {
          type: 'LineString' as const,
          coordinates: p.coords.map((c) => [c.longitude, c.latitude]),
        },
      }));
    return features.length ? { type: 'FeatureCollection' as const, features } : null;
  }, [pathways]);

  return (
    <View style={style}>
      <Mapbox.MapView
        style={StyleSheet.absoluteFillObject}
        styleURL={STYLE_URL[styleKey]}
        attributionEnabled={attributionEnabled}
        logoEnabled={logoEnabled}
        scrollEnabled={scrollEnabled}
        zoomEnabled={zoomEnabled}
        rotateEnabled={rotateEnabled}
        pitchEnabled={pitchEnabled}
        compassEnabled={false}
        scaleBarEnabled={false}
        onPress={(e: any) => {
          const f = e?.geometry?.coordinates;
          if (Array.isArray(f) && f.length >= 2 && onPress) {
            onPress({ longitude: f[0], latitude: f[1] });
          }
        }}
        onCameraChanged={
          onCameraChanged
            ? (e: any) => {
                const c = e.properties;
                onCameraChanged({
                  center: { longitude: c.center[0], latitude: c.center[1] },
                  zoom: c.zoom,
                  pitch: c.pitch,
                  bearing: c.bearing,
                });
              }
            : undefined
        }
      >
        <Mapbox.Camera
          ref={cameraRef}
          defaultSettings={
            initialCenter
              ? {
                  centerCoordinate: [initialCenter.longitude, initialCenter.latitude],
                  zoomLevel: initialZoom,
                  pitch: initialPitch,
                }
              : undefined
          }
          followUserLocation={followUser}
          followUserMode={followUser ? Mapbox.UserTrackingMode.FollowWithCourse : undefined}
        />

        {showsUserLocation && (
          <Mapbox.UserLocation visible renderMode="native" androidRenderMode="gps" />
        )}

        {/* Path overlay — foot */}
        {footGeoJSON && (
          <Mapbox.ShapeSource id="path-foot" shape={footGeoJSON}>
            <Mapbox.LineLayer
              id="path-foot-layer"
              style={{
                lineColor: ACCENT,
                lineWidth: 3.5,
                lineOpacity: pathOverlayOpacity,
                lineCap: 'round',
                lineJoin: 'round',
              }}
            />
          </Mapbox.ShapeSource>
        )}

        {/* Path overlay — bike */}
        {bikeGeoJSON && (
          <Mapbox.ShapeSource id="path-bike" shape={bikeGeoJSON}>
            <Mapbox.LineLayer
              id="path-bike-layer"
              style={{
                lineColor: '#529CFF',
                lineWidth: 3,
                lineOpacity: pathOverlayOpacity,
                lineCap: 'round',
                lineJoin: 'round',
              }}
            />
          </Mapbox.ShapeSource>
        )}

        {/* Route polyline (halo + main) */}
        {routeGeoJSON && (
          <Mapbox.ShapeSource id="route-source" shape={routeGeoJSON}>
            <Mapbox.LineLayer
              id="route-halo"
              style={{
                lineColor: '#ffffff',
                lineWidth: 8,
                lineOpacity: 0.85,
                lineCap: 'round',
                lineJoin: 'round',
              }}
            />
            <Mapbox.LineLayer
              id="route-main"
              style={{
                lineColor: ACCENT,
                lineWidth: 5,
                lineCap: 'round',
                lineJoin: 'round',
              }}
              aboveLayerID="route-halo"
            />
          </Mapbox.ShapeSource>
        )}

        {/* Waypoint markers */}
        {waypoints &&
          waypoints.map((wp, i) => {
            const isStart = i === 0;
            const isEnd = i === waypoints.length - 1 && waypoints.length > 1;
            const label = isStart ? 'A' : isEnd ? 'B' : String(i);
            const bg = isStart ? '#34C759' : isEnd ? '#FF3B30' : ACCENT;
            return (
              <Mapbox.PointAnnotation
                key={`wp-${i}`}
                id={`wp-${i}`}
                coordinate={[wp.longitude, wp.latitude]}
                draggable={draggableWaypoints}
                onDragEnd={(e: any) => {
                  const c = e?.geometry?.coordinates;
                  if (Array.isArray(c) && c.length >= 2) {
                    onWaypointDragEnd?.(i, { longitude: c[0], latitude: c[1] });
                  }
                }}
              >
                <View style={[ms.wpMarker, { backgroundColor: bg }]}>
                  <Text style={ms.wpMarkerTxt}>{label}</Text>
                </View>
              </Mapbox.PointAnnotation>
            );
          })}

        {/* Simple start/end dots when waypoints not provided */}
        {showStartEnd && !waypoints && routeCoords && routeCoords.length > 0 && (
          <>
            <Mapbox.MarkerView
              id="route-start"
              coordinate={[routeCoords[0].longitude, routeCoords[0].latitude]}
              anchor={{ x: 0.5, y: 0.5 }}
            >
              <View style={ms.dotStart} />
            </Mapbox.MarkerView>
            {routeCoords.length > 1 && (
              <Mapbox.MarkerView
                id="route-end"
                coordinate={[
                  routeCoords[routeCoords.length - 1].longitude,
                  routeCoords[routeCoords.length - 1].latitude,
                ]}
                anchor={{ x: 0.5, y: 0.5 }}
              >
                <View style={ms.dotEnd} />
              </Mapbox.MarkerView>
            )}
          </>
        )}

        {/* KM markers */}
        {kmMarkers &&
          kmMarkers.map((m) => (
            <Mapbox.MarkerView
              key={`km-${m.km}`}
              id={`km-${m.km}`}
              coordinate={[m.coord.longitude, m.coord.latitude]}
              anchor={{ x: 0.5, y: 0.5 }}
            >
              <View style={ms.kmMarker}>
                <Text style={ms.kmMarkerTxt}>{m.km}</Text>
              </View>
            </Mapbox.MarkerView>
          ))}
      </Mapbox.MapView>
    </View>
  );
});

export default MapboxRouteView;

// Helpers
function bearingBetween(a: LatLng, b: LatLng): number {
  const φ1 = (a.latitude * Math.PI) / 180;
  const φ2 = (b.latitude * Math.PI) / 180;
  const Δλ = ((b.longitude - a.longitude) * Math.PI) / 180;
  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
  const θ = Math.atan2(y, x);
  return ((θ * 180) / Math.PI + 360) % 360;
}

const ms = StyleSheet.create({
  wpMarker: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#fff',
  },
  wpMarkerTxt: { fontSize: 11, fontWeight: '800', color: '#fff', letterSpacing: -0.3 },
  dotStart: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#34C759',
    borderWidth: 3,
    borderColor: '#fff',
  },
  dotEnd: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#FF3B30',
    borderWidth: 3,
    borderColor: '#fff',
  },
  kmMarker: {
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 9,
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: ACCENT,
    minWidth: 22,
    alignItems: 'center',
  },
  kmMarkerTxt: { fontSize: 10.5, fontWeight: '900', color: ACCENT },
});
