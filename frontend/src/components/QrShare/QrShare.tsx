import { QRCodeSVG } from 'qrcode.react';
import { buildShareUrl, useCopyToClipboard } from './QrShare.ts';
import './QrShare.scss';

interface QrShareProps {
  pollId: number;
}

export default function QrShare({ pollId }: QrShareProps) {
  const url = buildShareUrl(pollId);
  const { copied, copy } = useCopyToClipboard();

  return (
    <div className="qr-share">
      <QRCodeSVG
        value={url}
        size={148}
        marginSize={1}
        className="qr-share__code"
        title="Código QR da votação"
      />
      <div className="qr-share__body">
        <p className="qr-share__title">Partilha com o público</p>
        <a className="qr-share__link" href={url} target="_blank" rel="noreferrer">
          {url}
        </a>
        <button type="button" className="btn btn--small" onClick={() => copy(url)}>
          {copied ? 'Copiado ✓' : 'Copiar link'}
        </button>
      </div>
    </div>
  );
}
