import QRCodeScanner from "../../common/QRCodeScanner";

const CreateMultisigByScanning = (props) => {
  const handleScanSuccess = (scan) => console.log(scan);
  const handleScanError = (error) => console.log(error);

  return (
    <QRCodeScanner
      qrCodeSuccessCallback={handleScanSuccess}
      qrCodeErrorCallback={handleScanError}
    />
  );
};

export default CreateMultisigByScanning;
