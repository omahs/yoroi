import React from 'react'
import Svg, {Path} from 'react-native-svg'

type Props = {
  size?: number
  color?: string
}

export const CheckFilled = ({size = 40, color}: Props) => (
  <Svg width={size} height={size} viewBox="-2 -2 28 28">
    <Path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M10.0649 2.49635C10.6575 2.16989 11.3234 1.99911 12 2C12.6708 2.00048 13.3307 2.16966 13.9191 2.49197C14.5074 2.81428 15.0052 3.27937 15.3667 3.84445C16.0245 3.69706 16.7088 3.71831 17.3562 3.90621C18.0036 4.09412 18.593 4.44258 19.0696 4.91924C19.5463 5.3959 19.8948 5.9853 20.0827 6.63268C20.2706 7.28006 20.2918 7.96443 20.1444 8.62222C20.7132 8.98342 21.1814 9.48241 21.5058 10.0729C21.8302 10.6634 22.0002 11.3263 22 12C21.9995 12.6708 21.8303 13.3307 21.508 13.9191C21.1857 14.5074 20.7206 15.0052 20.1556 15.3667C20.3029 16.0245 20.2817 16.7088 20.0938 17.3562C19.9059 18.0036 19.5574 18.593 19.0808 19.0696C18.6041 19.5463 18.0147 19.8948 17.3673 20.0827C16.7199 20.2706 16.0356 20.2918 15.3778 20.1444C15.0166 20.7132 14.5176 21.1815 13.9271 21.5058C13.3366 21.8302 12.6737 22.0002 12 22C11.3319 21.9946 10.6758 21.822 10.0916 21.4979C9.50742 21.1737 9.01371 20.7084 8.65555 20.1444C7.99556 20.2963 7.30781 20.2781 6.65678 20.0915C6.00574 19.905 5.41273 19.5561 4.93333 19.0778C4.46233 18.6006 4.11882 18.0127 3.93438 17.3682C3.74993 16.7236 3.73047 16.043 3.87778 15.3889C3.30334 15.0293 2.82966 14.5297 2.50121 13.937C2.17275 13.3442 2.00029 12.6777 2 12C2.00217 11.3242 2.17553 10.66 2.50389 10.0693C2.83226 9.47862 3.30493 8.98077 3.87778 8.62222C3.72906 7.96907 3.74676 7.28903 3.92925 6.6445C4.11174 5.99996 4.45317 5.41158 4.92222 4.93334C5.63686 4.21416 6.59794 3.79319 7.61111 3.75556C7.94779 3.75036 8.28378 3.78769 8.61111 3.86667C8.97199 3.29429 9.47217 2.82281 10.0649 2.49635ZM15.7071 9.29289C16.0976 9.68342 16.0976 10.3166 15.7071 10.7071L11.7077 14.7065C11.366 15.0482 10.8379 15.0915 10.4498 14.8352C10.3943 14.7986 10.3417 14.7559 10.2929 14.7071L8.29289 12.7071C7.90237 12.3166 7.90237 11.6834 8.29289 11.2929C8.68342 10.9024 9.31658 10.9024 9.70711 11.2929L11 12.5858L14.2929 9.29289C14.6834 8.90237 15.3166 8.90237 15.7071 9.29289Z"
      fill={color}
    />
  </Svg>
)