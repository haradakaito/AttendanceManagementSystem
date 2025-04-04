import nfc
from shared.codec import Codec
from shared.config import LOG_PATHS
from shared.error_handler import ErrorHandler

class NFCReader:
    """NFCリーダークラス（UID読み取り & ハッシュ化）"""

    def __init__(self):
        self.hashed_id = None
        self.logger    = ErrorHandler(log_file=LOG_PATHS["card_reader"])

    def read(self) -> str:
        """NFCタグを読み取り，UIDをハッシュ化して保持する"""
        try:
            # with 構文で安全にクローズ
            with nfc.ContactlessFrontend('usb') as clf:

                def on_connect(tag):
                    uid            = tag.identifier.hex()
                    self.hashed_id = Codec.hash_text(uid)
                    return False

                clf.connect(rdwr={'targets': ['212F'], 'on-connect': on_connect})

            return self.hashed_id

        except Exception as e:
            self.logger.log_error(f"Error: {e}")
            raise e

    def clear(self):
        self.hashed_id = None