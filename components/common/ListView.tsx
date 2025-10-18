import React, { forwardRef, PropsWithoutRef } from "react"
import { FlatList, FlatListProps } from "react-native"

export type ListViewRef<T> = FlatList<T>

export type ListViewProps<T> = PropsWithoutRef<FlatListProps<T>>

/**
 * A simple ListView component that wraps FlatList.
 * This provides a consistent interface across the app.
 */
export const ListView = forwardRef<ListViewRef<any>, ListViewProps<any>>(
  function ListView(props, ref) {
    return <FlatList ref={ref} {...props} />
  },
)