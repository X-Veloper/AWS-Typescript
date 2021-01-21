export type SCAN = {
  tableName: string
}

export type SCAN_ALL = {
  tableName: string
}

export type QUERY = {
  tableName: string
  pk: string
  pv: any
}

export type QUERY_SORT = {
  tableName: string
  pk: string
  pv: string
  sk: string
  sv: string
  project?: PROJECT_KEYS | []
}

export type QUERY_BETWEEN = {
  tableName: string
  pk: string
  pv: string
  sk: string
  start: string
  end: string
  project?: PROJECT_KEYS | []
}

export type UPDATE_SORT = {
  tableName: string
  pk: string
  pv: any
  sk: string
  sv: any
  item: any
}

export type QUERY_INDEX = {
  tableName: string
  indexName: string
  pk: string
  pv: string
  project?: PROJECT_KEYS
}

export type QUERY_INDEX_SORT = {
  tableName: string
  indexName: string
  pk: string
  pv: string
  sk: string
  sv: string
  project?: PROJECT_KEYS
}

export type QUERY_INDEX_CONTAIN = {
  tableName: string
  indexName: string
  pk: string
  pv: string
  keywordKey: string
  keywordValue: string
  project?: PROJECT_KEYS
}

export type PUT = {
  tableName: string
  item: {}
}

export type PROJECT_KEYS = Array<string>