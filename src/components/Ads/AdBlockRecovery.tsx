"use client";

import { usePathname } from "next/navigation";
import Script from "next/script";

interface AdBlockRecoveryProps {
  isSupporter: boolean;
}

const AdBlockRecovery = ({ isSupporter }: AdBlockRecoveryProps) => {
  const pathname = usePathname();

  if (isSupporter || pathname === "/supporting" || pathname === "/redeem") {
    return null;
  }

  return (
    <Script
      id="nitropay-adblock-detection"
      strategy="afterInteractive"
      dangerouslySetInnerHTML={{
        __html: `
          // Make npDetect global so we can check it on route changes
          window.npDetect = window.npDetect || new (function () {
            this.blocking = false;
            var errcnt = 0;
            var self = this;
            
            var dispatchBlockingEvent = function() {
              self.blocking = true;
              if (document.dispatchEvent && window.CustomEvent) {
                document.dispatchEvent(
                  new CustomEvent('np.detect', {
                    detail: {
                      blocking: self.blocking,
                    },
                  })
                );
              }
            };
            
            this.runTest = function() {
              errcnt = 0; // Reset error count
              testImg();
            };
            
            function testImg() {
              // Check if NitroAds already detected blocking
              if (window.nitroAds && window.nitroAds.abp === true) {
                dispatchBlockingEvent();
                return;
              }
              
              var img = new Image();
              
              img.onerror = () => {
                errcnt++;
                if (errcnt < 3) {
                  setTimeout(testImg, 250);
                } else {
                  dispatchBlockingEvent();
                }
              };
              
              img.onload = () => {
                // Canvas-based pixel detection (more robust)
                const canvas = document.createElement('canvas');
                canvas.style.pointerEvents = 'none';
                let ctx = document.body.appendChild(canvas).getContext('2d');
                
                if (ctx) {
                  ctx.drawImage(img, 0, 0);
                  const imageData = ctx.getImageData(0, 0, 1, 1);
                  const data = imageData.data;
                  canvas.remove();
                  
                  // Check pixel value - if NOT white (255), ad blocker is detected
                  if (data[0] !== 255) {
                    dispatchBlockingEvent();
                    return;
                  }
                  self.blocking = false;
                }
              };
              
              img.crossOrigin = 'anonymous';
              img.src = 'https://s.nitropay.com/2.gif?' + Math.random() + '&adslot=';
            }
            
            // Wait 2 seconds before initial test
            setTimeout(this.runTest.bind(this), 2000);
          })();
          
          // Re-run test on route changes (for SPA navigation)
          if (window.navigation) {
            window.navigation.addEventListener('navigate', () => {
              setTimeout(() => window.npDetect.runTest(), 2000);
            });
          }
        `,
      }}
    />
  );
};

export default AdBlockRecovery;
