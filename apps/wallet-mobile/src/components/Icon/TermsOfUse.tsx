import React from 'react'
import Svg, {Path} from 'react-native-svg'

type Props = {
  size?: number
  color?: string
}

export const TermsOfUse = ({size = 36, color = 'black'}: Props) => (
  <Svg width={size} height={size} viewBox="-2 -2 28 28">
    <Path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M4.79557 2.83013C5.30898 2.30205 6.01142 2 6.75 2H14H14.1875C14.4576 2 14.7162 2.10926 14.9045 2.30292L19.717 7.25292C19.8985 7.43958 20 7.68966 20 7.95V8V19.2C20 19.9337 19.7169 20.6427 19.2044 21.1699C18.691 21.698 17.9886 22 17.25 22H6.75C6.01142 22 5.30898 21.698 4.79557 21.1699C4.28308 20.6427 4 19.9337 4 19.2V4.8C4 4.06634 4.28308 3.35726 4.79557 2.83013ZM6.75 4H13V8C13 8.55228 13.4477 9 14 9H18V19.2C18 19.4211 17.9143 19.6277 17.7704 19.7757C17.6275 19.9228 17.4397 20 17.25 20H6.75C6.56032 20 6.37252 19.9228 6.22956 19.7757C6.08566 19.6277 6 19.4211 6 19.2V4.8C6 4.57888 6.08566 4.37229 6.22956 4.22429C6.37252 4.07724 6.56032 4 6.75 4ZM15 7H16.6817L15 5.27027V7ZM9 12C8.44772 12 8 12.4477 8 13C8 13.5523 8.44772 14 9 14H15C15.5523 14 16 13.5523 16 13C16 12.4477 15.5523 12 15 12H9ZM8 17C8 16.4477 8.44772 16 9 16H15C15.5523 16 16 16.4477 16 17C16 17.5523 15.5523 18 15 18H9C8.44772 18 8 17.5523 8 17ZM9 8C8.44772 8 8 8.44772 8 9C8 9.55228 8.44772 10 9 10H10C10.5523 10 11 9.55228 11 9C11 8.44772 10.5523 8 10 8H9Z"
      fill={color}
    />
  </Svg>
)