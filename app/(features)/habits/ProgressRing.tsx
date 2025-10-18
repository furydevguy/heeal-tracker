import React from 'react';
import { View } from 'react-native';
import { Circle, Svg } from 'react-native-svg';

export default function ProgressRing({
  size=92, stroke=10, progress=0, track="#EEE", color="#22c55e", center
}: { size?:number; stroke?:number; progress:number; track?:string; color?:string; center?:React.ReactNode }) {
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const dash = c * Math.min(1, Math.max(0, progress))
  return (
    <View style={{ width:size, height:size, alignItems:'center', justifyContent:'center' }}>
      <Svg width={size} height={size}>
        <Circle cx={size/2} cy={size/2} r={r} stroke={track} strokeWidth={stroke} fill="none" />
        <Circle
          cx={size/2} cy={size/2} r={r}
          stroke={color} strokeWidth={stroke} fill="none"
          strokeDasharray={`${dash}, ${c}`}
          strokeLinecap="round"
          rotation="-90" origin={`${size/2}, ${size/2}`}
        />
      </Svg>
      <View style={{ position:'absolute', alignItems:'center', justifyContent:'center' }}>
        {center}
      </View>
    </View>
  )
}
