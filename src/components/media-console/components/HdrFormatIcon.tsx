import React, {memo} from 'react';
import Svg, {G, Path} from 'react-native-svg';

export function hdrIconWidth(type: string, height: number) {
  return height * (type === 'Dolby Vision' ? 298 / 80 : type === 'HLG' ? 152 / 62 : 162 / 60);
}

export default memo(function HdrFormatIcon({type, height}: {type: string; height: number}) {
  const dolby = type === 'Dolby Vision';
  const hlg = type === 'HLG';
  return <Svg width={hdrIconWidth(type, height)} height={height}
    viewBox={dolby ? '24 24 298 80' : hlg ? '44 24 152 62' : '39 25 162 60'} opacity={0.6} accessible={false}>
    {dolby ? <>
      <G fill="#fff" fillRule="evenodd" transform="translate(24.37 -59.14) scale(1.28)">
        <Path d="M28.4 96.375c0-4.259-1.277-8.094-3.835-11.076-2.556-2.982-5.54-4.265-8.948-4.265H9.226v30.683h6.391c3.409 0 6.393-1.277 8.948-4.26 2.558-2.982 3.835-6.816 3.835-11.082zm32.385 15.342V81.034h-6.393c-3.409 0-6.391 1.283-8.946 4.265-2.558 2.982-3.836 6.817-3.836 11.076 0 4.266 1.278 8.1 3.836 11.082 2.556 2.982 5.538 4.26 8.946 4.26h6.393zM2.834 75.5H33.94v41.758H2.834V75.5zm33.664 0h30.678v41.758H36.498V75.5z" />
      </G>
      <Path d="M139 27V101" fill="none" stroke="#fff" strokeWidth={6} />
      <G fill="#fff" fillRule="evenodd">
        <Path d="M182 34H207C231 34 243 45.5 243 64S231 94 207 94H182ZM196 46V82H207C221.8 82 229 76 229 64S221.8 46 207 46Z" />
        <Path d="M257 34H271L287.2 78L303.3 34H317.5L294 94H280.5Z" />
      </G>
    </> : <G fill="#fff" transform={hlg
      ? 'matrix(0.03576073 0 0 -0.03576073 44.366060 81.641743)'
      : 'matrix(0.03691275 0 0 -0.03691275 39.161074 82.5)'}>
      <Path d="M111 0H419V628H1052V0H1359V1490H1052V892H419V1490H111Z" />
      {hlg ? <>
        <Path d="M111 0H1096V264H419V1490H111Z" transform="translate(1509,0)" />
        <Path d="M772 -24C1158 -24 1432 232 1432 602V792H806V558H1131C1128 373 985 248 780 248C526 248 373 438 373 744C373 1051 525 1242 776 1242C954 1242 1077 1143 1110 991H1422C1384 1303 1109 1514 767 1514C365 1514 63 1220 63 744C63 284 350 -24 772 -24Z" transform="translate(2687,0)" />
      </> : <>
        <Path d="M637 0C1094 0 1373 287 1373 746C1373 1203 1091 1490 643 1490H111V0ZM419 259V1231H624C920 1231 1063 1059 1063 746C1063 432 922 259 621 259Z" transform="translate(1509,0)" />
        <Path d="M111 0H419V521H689C690 521 691 521 692 521L956 0H1286L987 579C1154 656 1253 804 1253 1001C1253 1301 1043 1490 707 1490H111ZM419 768V1234H688C851 1234 952 1143 952 1001C952 859 851 768 689 768Z" transform="translate(2983,0)" />
      </>}
    </G>}
  </Svg>;
});
