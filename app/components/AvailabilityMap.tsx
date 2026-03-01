'use client';

import { useState } from 'react';
import { ComposableMap, Geographies, Geography, ZoomableGroup } from 'react-simple-maps';

const GEO_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json';

const COUNTRY_ISO_TO_CODE: Record<string, string> = {
  '840': 'US', '826': 'GB', '124': 'CA', '036': 'AU', '276': 'DE',
  '250': 'FR', '392': 'JP', '410': 'KR', '356': 'IN', '076': 'BR',
  '484': 'MX', '724': 'ES', '380': 'IT', '528': 'NL', '752': 'SE',
  '620': 'PT', '578': 'NO', '208': 'DK', '246': 'FI', '756': 'CH',
  '040': 'AT', '056': 'BE', '616': 'PL', '203': 'CZ', '348': 'HU',
  '642': 'RO', '300': 'GR', '792': 'TR', '643': 'RU', '156': 'CN',
  '704': 'VN', '764': 'TH', '458': 'MY', '360': 'ID', '608': 'PH',
  '702': 'SG', '566': 'NG', '710': 'ZA', '818': 'EG', '012': 'DZ',
  '504': 'MA', '404': 'KE', '233': 'EE', '428': 'LV', '440': 'LT',
  '703': 'SK', '705': 'SI', '191': 'HR', '100': 'BG', '688': 'RS',
  '032': 'AR', '152': 'CL', '170': 'CO', '604': 'PE', '218': 'EC',
};

const SERVICE_NAMES: Record<string, string> = {
  netflix: 'Netflix', prime: 'Prime Video', disney: 'Disney+',
  hulu: 'Hulu', hbo: 'Max', apple: 'Apple TV+',
  paramount: 'Paramount+', peacock: 'Peacock', mubi: 'MUBI',
};

interface StreamingOption {
  service: { id: string; name: string };
  type: string;
  link: string;
}

interface Props {
  streamingOptions: Record<string, StreamingOption[]>;
  title: string;
}

export default function AvailabilityMap({ streamingOptions, title }: Props) {
  const [tooltip, setTooltip] = useState<{ name: string; services: string[]; x: number; y: number } | null>(null);
  const [position, setPosition] = useState({ coordinates: [0, 20] as [number, number], zoom: 1 });

  const availableCountries = new Set(Object.keys(streamingOptions).map(c => c.toUpperCase()));

  function getCountryCode(geoNumeric: string): string | null {
    return COUNTRY_ISO_TO_CODE[geoNumeric] || null;
  }

  function getServices(countryCode: string): string[] {
    const options = streamingOptions[countryCode.toLowerCase()] || [];
    const names = options.map(o => SERVICE_NAMES[o.service.id] || o.service.name);
    return [...new Set(names)];
  }

  return (
    <div className="relative w-full rounded-2xl overflow-hidden"
      style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}>
      <div className="px-4 pt-4 pb-2 flex items-center justify-between">
        <h3 className="text-sm font-bold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.3)' }}>
          Global Availability — {title}
        </h3>
        <div className="flex items-center gap-3 text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: '#22c55e' }}></span>
            Available ({availableCountries.size} countries)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: 'rgba(255,255,255,0.08)' }}></span>
            Not available
          </span>
        </div>
      </div>

      <ComposableMap projectionConfig={{ scale: 147 }} style={{ width: '100%', height: 'auto' }}>
        <ZoomableGroup
          zoom={position.zoom}
          center={position.coordinates}
          onMoveEnd={(pos) => setPosition({ coordinates: pos.coordinates as [number, number], zoom: pos.zoom })}
        >
          <Geographies geography={GEO_URL}>
            {({ geographies }) =>
              geographies.map((geo) => {
                const numericId = geo.id?.toString().padStart(3, '0');
                const countryCode = getCountryCode(numericId);
                const isAvailable = countryCode ? availableCountries.has(countryCode) : false;
                const services = countryCode ? getServices(countryCode) : [];

                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    onMouseEnter={(e) => {
                      if (countryCode) {
                        setTooltip({
                          name: geo.properties.name,
                          services,
                          x: e.clientX,
                          y: e.clientY,
                        });
                      }
                    }}
                    onMouseLeave={() => setTooltip(null)}
                    style={{
                      default: {
                        fill: isAvailable ? '#22c55e' : 'rgba(255,255,255,0.06)',
                        stroke: 'rgba(255,255,255,0.05)',
                        strokeWidth: 0.5,
                        outline: 'none',
                        transition: 'fill 0.2s',
                      },
                      hover: {
                        fill: isAvailable ? '#4ade80' : 'rgba(255,255,255,0.12)',
                        stroke: 'rgba(255,255,255,0.1)',
                        strokeWidth: 0.5,
                        outline: 'none',
                        cursor: 'pointer',
                      },
                      pressed: { outline: 'none' },
                    }}
                  />
                );
              })
            }
          </Geographies>
        </ZoomableGroup>
      </ComposableMap>

      {/* Zoom controls */}
      <div className="absolute bottom-4 right-4 flex flex-col gap-1">
        <button
          onClick={() => setPosition(p => ({ ...p, zoom: Math.min(p.zoom * 1.5, 8) }))}
          className="w-7 h-7 rounded-lg flex items-center justify-center text-sm font-bold transition-colors hover:bg-white/10"
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)' }}>
          +
        </button>
        <button
          onClick={() => setPosition(p => ({ ...p, zoom: Math.max(p.zoom / 1.5, 1) }))}
          className="w-7 h-7 rounded-lg flex items-center justify-center text-sm font-bold transition-colors hover:bg-white/10"
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)' }}>
          −
        </button>
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div className="fixed z-50 px-3 py-2 rounded-xl pointer-events-none shadow-xl"
          style={{
            left: tooltip.x + 12, top: tooltip.y - 40,
            background: '#12121e', border: '1px solid rgba(255,255,255,0.1)',
            transform: 'translateY(-50%)',
          }}>
          <p className="text-xs font-bold mb-1">{tooltip.name}</p>
          {tooltip.services.length > 0 ? (
            <div className="flex flex-wrap gap-1">
              {tooltip.services.map((s, i) => (
                <span key={i} className="text-xs px-1.5 py-0.5 rounded-full"
                  style={{ background: 'rgba(34,197,94,0.15)', color: '#4ade80', border: '1px solid rgba(34,197,94,0.2)' }}>
                  {s}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>Not available</p>
          )}
        </div>
      )}
    </div>
  );
}
