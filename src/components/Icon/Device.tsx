import React from 'react'
import Svg, {Path} from 'react-native-svg'

type Props = {
  size?: number
  color?: string
}

export const Device = ({size = 36, color = 'black'}: Props) => (
  <Svg width={size} height={size} viewBox="-2 -2 28 28">
    <Path
      d="M5 16C5 15.4477 5.44772 15 6 15H6.01C6.56228 15 7.01 15.4477 7.01 16C7.01 16.5523 6.56228 17 6.01 17H6C5.44772 17 5 16.5523 5 16Z"
      fill={color}
    />
    <Path
      d="M10 15C9.44772 15 9 15.4477 9 16C9 16.5523 9.44772 17 10 17H10.01C10.5623 17 11.01 16.5523 11.01 16C11.01 15.4477 10.5623 15 10.01 15H10Z"
      fill={color}
    />
    <Path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M16.284 3H7.716C7.17189 3.00032 6.64658 3.16978 6.20097 3.47682C5.75712 3.78264 5.41233 4.21004 5.19278 4.70031L5.19213 4.70175L2.09717 11.5695C2.03488 11.6999 2 11.8459 2 12V18C2 18.7636 2.27205 19.5144 2.78391 20.0832C3.2989 20.6554 4.02136 21 4.8 21H19.2C19.9786 21 20.7011 20.6554 21.2161 20.0832C21.7279 19.5144 22 18.7636 22 18V12C22 11.9867 21.9997 11.9735 21.9992 11.9602C21.9937 11.8207 21.9597 11.6886 21.9028 11.5694L18.8079 4.70175L18.8071 4.70003C18.5875 4.20988 18.2428 3.78258 17.799 3.47682C17.3534 3.16978 16.8281 3.00032 16.284 3ZM19.4525 11L16.9833 5.52086L16.9821 5.51825C16.9036 5.3427 16.7892 5.2098 16.6643 5.12374C16.5408 5.03865 16.4092 5.00012 16.2836 5H7.71636C7.59079 5.00012 7.45922 5.03865 7.33571 5.12374C7.2108 5.20981 7.09638 5.3427 7.01787 5.51825L7.0167 5.52086L4.54751 11H19.4525ZM4 13V18C4 18.2972 4.10723 18.5638 4.2705 18.7452C4.43064 18.9232 4.62386 19 4.8 19H19.2C19.3761 19 19.5694 18.9232 19.7295 18.7452C19.8928 18.5638 20 18.2972 20 18V13H4Z"
      fill={color}
    />
  </Svg>
)