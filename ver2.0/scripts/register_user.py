import os
from dotenv import load_dotenv
from lib import APIClient, Codec, ErrorHandler

if __name__ == "__main__":
    try:
        nfc_id = "test"
        name   = "test"

        # 環境変数の読み込み
        load_dotenv()

        # APIクライアントの初期化
        api_client = APIClient(
            access_key   = os.getenv("ACCESS_KEY"),
            secret_key   = os.getenv("SECRET_KEY"),
            resource_id  = os.getenv("RESOURCE_ID"),
            service_name = os.getenv("SERVICE_NAME"),
            region_name  = os.getenv("REGION_NAME"),
            x_api_key    = os.getenv("X_API_KEY")
        )

        # APIリクエストの送信
        response = api_client.send_request(
            stage_name = "v1/user",
            method     = "POST",
            data       = {
                "id"  : Codec.base64_encode(nfc_id),
                "name": Codec.base64_encode(name)
            }
        )
        # レスポンスを解析
        if response.json().get("statusCode") != 200:
            ErrorHandler(log_file="/home/pi/attendance_system/logs/register_user.log").log_error(f"Error: {response.json()}")
        # レスポンスを表示
        print(response.json())

    except Exception as e:
        ErrorHandler(log_file="/home/pi/attendance_system/logs/register_user.log").handle_error(e)