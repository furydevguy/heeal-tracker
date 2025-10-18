import {
  AlertTriangle,
  ArrowLeft,
  Bell,
  BellRing,
  Check,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  Globe,
  HelpCircle,
  Lock,
  LogOut,
  Menu,
  MoreHorizontal,
  Pencil,
  Settings,
  Star,
  ToggleLeft,
  User,
  X,
} from "lucide-react-native"
import * as React from "react"
import { ComponentType } from "react"
import {
  StyleProp,
  TouchableOpacity,
  TouchableOpacityProps,
  View,
  ViewProps,
  ViewStyle,
} from "react-native"

// Map icon names to Lucide components
const iconRegistry = {
  alert: AlertTriangle,
  avatar: User,
  back: ArrowLeft,
  bell: Bell,
  bellFilled: BellRing,
  caretLeft: ChevronLeft,
  caretRight: ChevronRight,
  check: Check,
  globe: Globe,
  hidden: EyeOff,
  ladybug: HelpCircle, // Using help circle as replacement
  lock: Lock,
  lockFilled: Lock,
  logout: LogOut,
  menu: Menu,
  more: MoreHorizontal,
  pencil: Pencil,
  settings: Settings,
  star: Star,
  support: HelpCircle,
  toggle: ToggleLeft,
  user: User,
  view: Eye,
  x: X,
} as const

export type IconTypes = keyof typeof iconRegistry

interface IconProps extends TouchableOpacityProps {
  /**
   * The name of the icon
   */
  icon: IconTypes

  /**
   * An optional tint color for the icon
   */
  color?: string

  /**
   * An optional size for the icon. If not provided, defaults to 24.
   */
  size?: number

  /**
   * Style overrides for the icon container
   */
  containerStyle?: StyleProp<ViewStyle>

  /**
   * An optional function to be called when the icon is pressed
   */
  onPress?: TouchableOpacityProps["onPress"]
}

/**
 * A component to render a Lucide icon.
 * It is wrapped in a <TouchableOpacity /> if `onPress` is provided, otherwise a <View />.
 * @param {IconProps} props - The props for the `Icon` component.
 * @returns {JSX.Element} The rendered `Icon` component.
 */
export function Icon(props: IconProps) {
  const {
    icon,
    color = "#000000",
    size = 24,
    containerStyle: $containerStyleOverride,
    ...WrapperProps
  } = props

  const isPressable = !!WrapperProps.onPress
  const Wrapper = (WrapperProps?.onPress ? TouchableOpacity : View) as ComponentType<
    TouchableOpacityProps | ViewProps
  >

  const IconComponent = iconRegistry[icon]

  if (!IconComponent) {
    console.warn(`Icon "${icon}" not found in iconRegistry`)
    return null
  }

  return (
    <Wrapper
      accessibilityRole={isPressable ? "imagebutton" : undefined}
      {...WrapperProps}
      style={$containerStyleOverride}
    >
      <IconComponent
        size={size}
        color={color}
        strokeWidth={2}
      />
    </Wrapper>
  )
}