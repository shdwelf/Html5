
int __cdecl FUN_10004990(byte param_1)

{
  uint uVar1;
  _diskfree_t local_14;
  
  local_14.total_clusters = 0;
  local_14.avail_clusters = 0;
  local_14.sectors_per_cluster = 0;
  local_14.bytes_per_sector = 0;
  uVar1 = tolower((uint)param_1);
  uVar1 = _getdiskfree((uVar1 & 0xff) - 0x60,&local_14);
  if (uVar1 == 0) {
    return (local_14.total_clusters - local_14.avail_clusters) * local_14.sectors_per_cluster *
           local_14.bytes_per_sector;
  }
  return 0;
}

