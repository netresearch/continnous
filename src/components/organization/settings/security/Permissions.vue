<template>
  <div>
    <p class="md-caption">{{$tc('permission', 2)}}</p>
    <card-form
        ref="form"
        class="permissions"
        :firebase-path="'/security/organizations/' + organization.key + '/permissions'"
        :firebase-bind="true"
        :firebase-receive="firebaseReceive"
        :keys="roles"
        @saved="onSaved"
    >
      <template scope="form">
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
                  <div class="md-table-cell-container">{{$t('resources.' + resource)}}</div>
                </td>
              </tr>
              <tr class="md-table-row" v-for="(defaultAllowed, privilege) in privileges">
                <td class="md-table-cell">
                  <div class="md-table-cell-container">{{$t('actions.' + privilege)}}</div>
                </td>
                <td class="md-table-cell" v-for="role in roles">
                  <div class="md-table-cell-container">
                    <md-switch :value="form.values[role] && form.values[role][resource] && form.values[role][resource][privilege]" @click.native="onPermissionsChange(role, resource, privilege)"></md-switch>
                  </div>
                </td>
              </tr>
            </template>
            </tbody>
          </table>
        </div>
      </template>

      <md-button slot="secondaryButtons" @click="resetPermissionsToDefaults()" class="md-dense">{{$t('actions.resetToDefaults')}}</md-button>
    </card-form>
  </div>
</template>

<script>
  import extend from 'extend';
  import CardForm from '../../../form/Card';
  import Config from '../../../../models/Config';
  import Permissions from '../../../../models/Permissions';
  import Flashlight from '../../../../models/Flashlight';

  export default {
    components: {
      CardForm
    },
    props: ['organization'],
    data() {
      const defaultPermissions = Permissions.getDefaults();
      return {
        defaultPermissions,
        roles: Config.roles
      };
    },
    methods: {
      firebaseReceive(snapshot) {
        return extend(true, {}, this.defaultPermissions, snapshot.val() || {});
      },
      onPermissionsChange(role, resource, privilege) {
        const form = this.$refs.form;
        const allowed = !form.values[role][resource][privilege];
        const newRolePermissions = extend(true, {}, form.values[role]);
        newRolePermissions[resource][privilege] = allowed;
        form.onChange(role, newRolePermissions);
      },
      resetPermissionsToDefaults() {
        const form = this.$refs.form;
        this.roles.forEach((role) => {
          const newVal = extend(true, {}, this.defaultPermissions[role]);
          form.onChange(role, newVal);
          form.values[role] = newVal;
        });
      },
      onSaved() {
        const flashlightPermissions = {};
        const permissions = this.$refs.form.values;
        Object.keys(permissions).forEach((group) => {
          Object.keys(permissions[group]).forEach((resource) => {
            if (!flashlightPermissions.hasOwnProperty(resource)) {
              flashlightPermissions[resource] = { read: false };
            }
            if (permissions[group][resource].read) {
              flashlightPermissions[resource].read = true;
            }
          });
        });
        Flashlight.updatePaths(this.organization.key, 'organization', flashlightPermissions);
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