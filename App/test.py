
# Ahora `container` ya está listo para hacer:
# container.upsert_item(...)
from azure.cosmos import CosmosClient, PartitionKey

URL = "https://miguel2005.documents.azure.com:443/"
KEY = "0ZcRceV93VfD6fSR5pQc7KBWVn5pIyFifxSvU9dh6j9eBE6j3ijyfkn4sY2QK8xSlHQtCevA5GRwACDberDJeA=="
DATABASE_NAME = "Instru_database"
CONTAINER_NAME = "ECG_signal"
PARTITION_KEY = "/id"

client = CosmosClient(URL, credential=KEY)

# Crear la base de datos SIN throughput dedicado
database = client.create_database_if_not_exists(id=DATABASE_NAME)

# Crear el contenedor SIN throughput
container = database.create_container_if_not_exists(
    id=CONTAINER_NAME,
    partition_key=PartitionKey(path=PARTITION_KEY)
)

print("✔ Contenedor creado sin RU dedicadas")