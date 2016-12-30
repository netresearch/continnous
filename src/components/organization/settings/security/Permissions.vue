<template>
  <div>
    <p class="md-caption">{{$tc('permission', 2)}}</p>
    <md-card class="permissions">
      <div class="md-table">
        <table>
          <thead class="md-table-header">
          <tr class="md-table-row">
            <th class="md-table-head md-sorted">
              <div class="md-table-head-container">
                <div class="md-table-head-text">{{$tc('permission', 1)}}</div>
              </div>
            </th>
            <th class="md-table-head md-sorted" v-for="role in roles">
              <div class="md-table-head-container">
                <div class="md-table-head-text">{{$t('roles.' + role)}}</div>
              </div>
            </th>
          </tr>
          </thead>
          <tbody class="md-table-body">
          <template v-for="(privileges, resource) in defaultPermissions[roles[0]]">
            <tr class="md-table-row permissions-resource">
              <td class="md-table-cell" :colspan="roles.length + 1">
                <div class="md-table-cell-container">{{$t('permissions.' + resource)}}</div>
              </td>
            </tr>
            <tr class="md-table-row" v-for="(defaultAllowed, privilege) in privileges">
              <td class="md-table-cell">
                <div class="md-table-cell-container">{{$t('permissions.' + privilege)}}</div>
              </td>
              <td class="md-table-cell" v-for="role in roles">
                <div class="md-table-cell-container">
                  <md-switch :value="values[role] && values[role][resource] && values[role][resource][privilege]" @change="onPermissionsChange(role, resource, privilege, $event)"></md-switch>
                </div>
              </td>
            </tr>
          </template>
          </tbody>
        </table>
      </div>
      <md-card-actions>
        <md-button @click="save(roles.join('|'))" class="md-primary md-raised" :disabled="!hasChanged(roles.join('|'))">{{$t('actions.save')}}</md-button>
        <md-button @click="reset(roles.join('|'))" :disabled="!hasChanged(roles.join('|'), true)">{{$t('actions.reset')}}</md-button>
        <span style="flex: 1"></span>
        <md-button @click="resetPermissionsToDefaults()" class="md-dense">{{$t('actions.resetToDefaults')}}</md-button>
      </md-card-actions>
    </md-card>
  </div>
</template>

<script>
  import extend from 'extend';
  import Base from '../base';
  import Config from '../../../../models/Config';

  export default {
    extends: Base,
    props: ['organization'],
    data() {
      const defaultPermissions = Config.getDefaultPermissions();
      return {
        permissions: defaultPermissions,
        defaultPermissions,
        roles: Config.roles
      };
    },
    objectPath: 'permissions',
    bindToFirebase: true,
    firebasePath() {
      return '/security/organizations/' + this.organization.key + '/permissions';
    },
    firebaseReceive(snapshot) {
      return extend(true, {}, this.defaultPermissions, snapshot.val() || {});
    },
    methods: {
      onPermissionsChange(role, resource, privilege, allowed) {
        const newRolePermissions = extend(true, {}, this.permissions[role]);
        newRolePermissions[resource][privilege] = allowed;
        this.onChange(role, newRolePermissions);
      },
      resetPermissionsToDefaults() {
        this.roles.forEach((role) => {
          const newVal = extend(true, {}, this.defaultPermissions[role]);
          this.onChange(role, newVal);
          this.values[role] = newVal;
        });
      }
    }
  };
</script>

<style lang="scss" rel="stylesheet/scss">
  .permissions {
    tr.permissions-resource .md-table-cell {
      background: #F5F5F5 !important;
      font-weight: 500;
    }
  }
</style>