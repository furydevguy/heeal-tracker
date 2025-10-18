import { addDays, format, startOfWeek } from 'date-fns';
import React, { useMemo } from 'react';
import { StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';

function Dot({ dayNum, active }: { dayNum: number; active?: boolean }) {
  return (
    <View style={[s.dot, active && s.dotOn]}>
      <Text style={[s.dotText, active && {color:'#16a34a'}]}>{dayNum}</Text>
    </View>
  )
}

export default function WeekStrip({style}: {style?: StyleProp<ViewStyle>}) {
  const today = new Date()
  const start = startOfWeek(today, { weekStartsOn: 1 })
  const days = useMemo(() => Array.from({length:7},(_,i)=>addDays(start,i)), [start])

  return (
    <View style={[style, { paddingTop:8 }]}>
      <View style={{display:'flex', flexDirection:'row', justifyContent:'space-between', paddingHorizontal:22, gap:18 }}>
        {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map((d,i)=>(
          <Text key={i} style={s.dow}>{d}</Text>
        ))}
      </View>
      <View style={{display:'flex', flexDirection:'row', justifyContent:'space-between', paddingHorizontal:22, gap:18, marginTop:6 }}>
        {days.map((d,i)=>{
          const active = format(d,'yyyy-MM-dd') === format(today,'yyyy-MM-dd')
          return <Dot key={i} dayNum={Number(format(d,'d'))} active={active} />
        })}
      </View>
    </View>
  )
}

const s = StyleSheet.create({
  dow:{ color:'#667085', minWidth:28, textAlign:'center' },
  dot:{ minWidth:28, height:28, borderRadius:14, backgroundColor:'#F2F4F7', alignItems:'center', justifyContent:'center' },
  dotOn:{ backgroundColor:'#E8FBEF', borderWidth:2, borderColor:'#22c55e' },
  dotText:{ fontWeight:'600' },
})
