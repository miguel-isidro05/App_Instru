# Falta cambiar contenedores de evento y para ver usuarios, ademas cambiar ids.

# Importa FastAPI y componentes necesarios
from fastapi import FastAPI
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware

# Cosmos DB (versión moderna async)
from azure.cosmos.aio import CosmosClient

# ===========================
#  CONFIGURACIÓN COSMOS DB
# ===========================
URL = "https://miguel2005.documents.azure.com:443/"
KEY = "0ZcRceV93VfD6fSR5pQc7KBWVn5pIyFifxSvU9dh6j9eBE6j3ijyfkn4sY2QK8xSlHQtCevA5GRwACDberDJeA=="

DATABASE_NAME = "Instru_database"

# Instancia asíncrona del cliente
client = CosmosClient(URL, credential=KEY)
database = client.get_database_client(DATABASE_NAME)

# ===========================
#   INICIAR FASTAPI
# ===========================
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ===========================
#      MODELOS (Pydantic)
# ===========================
class RegisterRequest(BaseModel):
    correo: str
    usuario: str
    nombres: str
    apellidos: str
    contrasena: str

class EventRequest(BaseModel):
    actividad: str
    sintomas: str
    hora_aprox: str
    datos: str

# ===========================
#       ENDPOINTS
# ===========================

@app.get("/")
async def root():
    return {"message": "Probando FastAPI conectado a Cosmos DB!"}

#Nota: Recordar que las querys en Cosmos DB sirven para ambos tipos de contenedores,
#  tanto los con clave de partición como los sin clave de partición. Ademas ayudan
# a buscar items sin necesidad de conocer su id.

# ======================================
#         LOGIN (consultando Cosmos)
# ======================================
@app.get("/login")
async def login(usuario: str, contrasena: str):

    query = f"""
        SELECT * FROM c 
        WHERE c.type = 'usuario' AND c.id = '{usuario}'
    """
    container = database.get_container_client("Users")

    results = [
        item async for item in container.query_items(
            query=query,
            partition_key=None
        )
    ]

    if not results:
        return {"status": "error", "message": "Usuario no existe"}

    usuario_db = results[0]

    if usuario_db.get("contrasena") == contrasena:
        return {"status": "ok", "message": "Usuario encontrado"}

    return {"status": "error", "message": "Contraseña incorrecta"}


# ======================================
#         REGISTRO USUARIO
# ======================================
@app.post("/register")
async def register(request: RegisterRequest):

    item = {
        "id": request.usuario,
        "type": "usuario",
        "correo": request.correo,
        "nombres": request.nombres,
        "apellidos": request.apellidos,
        "contrasena": request.contrasena
    }
    container = database.get_container_client("Users")

    # upsert async CORRECTO
    await container.upsert_item(item)

    return {"status": "ok", "message": "Usuario registrado", "data": item}


# ======================================
#          REGISTRO EVENTO
# ======================================
@app.post("/evento")
async def evento(request: EventRequest):

    item = {
        "id": request.hora_aprox,  # Puedes cambiar a uuid
        "type": "evento",
        "actividad": request.actividad,
        "sintomas": request.sintomas,
        "hora_aprox": request.hora_aprox,
        "datos": request.datos
    }
    container = database.get_container_client("Evento")

    await container.upsert_item(item)

    return {"status": "ok", "message": "Evento registrado", "datos_evento": item}


# ======================================
#       OBTENER TODOS LOS EVENTOS
# ======================================
@app.get("/eventos")
async def obtener_eventos():
    container = database.get_container_client("Evento")
    query = "SELECT * FROM c WHERE c.type = 'evento'"

    eventos = [
        item async for item in container.query_items(
            query=query,
            partition_key=None
        )
    ]

    return {"eventos": eventos}


#Mi internet: 192.168.1.132

#uvicorn main:app --reload --host 0.0.0.0 
#ip: ipconfig getifaddr en0