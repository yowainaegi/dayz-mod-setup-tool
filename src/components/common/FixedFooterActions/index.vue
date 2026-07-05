<script lang="ts">
import { Comment, Fragment, Text, defineComponent, h, type VNode } from 'vue';

function flattenActions(nodes: VNode[]): VNode[] {
  return nodes.flatMap((node) => {
    if (node.type === Comment || node.type === Text) {
      return [];
    }

    if (node.type === Fragment && Array.isArray(node.children)) {
      return flattenActions(node.children as VNode[]);
    }

    return [node];
  });
}

function hasPrimaryButton(node: VNode): boolean {
  if (node.props?.type === 'primary') {
    return true;
  }

  if (Array.isArray(node.children)) {
    return node.children.some((child) => hasPrimaryButton(child as VNode));
  }

  if (node.children && typeof node.children === 'object' && 'default' in node.children) {
    const defaultSlot = node.children.default;
    if (typeof defaultSlot === 'function') {
      return flattenActions(defaultSlot()).some(hasPrimaryButton);
    }
  }

  return false;
}

function getNodeText(node: VNode): string {
  if (typeof node.children === 'string') {
    return node.children;
  }

  if (Array.isArray(node.children)) {
    return node.children.map((child) => getNodeText(child as VNode)).join('');
  }

  if (node.children && typeof node.children === 'object' && 'default' in node.children) {
    const defaultSlot = node.children.default;
    if (typeof defaultSlot === 'function') {
      return flattenActions(defaultSlot()).map(getNodeText).join('');
    }
  }

  return '';
}

function hasTwoCjkLabel(node: VNode): boolean {
  const label = getNodeText(node).trim();
  return Array.from(label).length === 2 && /[\u4e00-\u9fff]/.test(label);
}

export default defineComponent({
  name: 'FixedFooterActions',
  setup(_, { slots }) {
    return () => {
      const actions = flattenActions(slots.default?.() ?? []).slice(0, 2);
      const leftAction = actions.length === 1 && hasPrimaryButton(actions[0]) ? null : actions[0];
      const rightAction = actions.length === 1 && hasPrimaryButton(actions[0]) ? actions[0] : actions[1];

      return h('footer', { class: 'fixed-footer-actions' }, [
        h('div', { class: 'fixed-footer-actions-inner' }, [
          h('div', {
            class: [
              'fixed-footer-action',
              'fixed-footer-action-left',
              leftAction && hasTwoCjkLabel(leftAction) ? 'fixed-footer-action-spaced' : '',
            ],
          }, leftAction ? [leftAction] : []),
          h('div', {
            class: [
              'fixed-footer-action',
              'fixed-footer-action-right',
              rightAction && hasTwoCjkLabel(rightAction) ? 'fixed-footer-action-spaced' : '',
            ],
          }, rightAction ? [rightAction] : []),
        ]),
      ]);
    };
  },
});
</script>

<style scoped lang="less">
.fixed-footer-actions {
  flex: 0 0 48px;
  min-height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px 24px 10px;
  background: var(--app-color-bg-content);
}

.fixed-footer-actions-inner {
  width: min(520px, 100%);
  display: grid;
  grid-template-columns: 1fr 1fr;
  align-items: center;
  gap: 16px;
}

.fixed-footer-action {
  display: flex;
  align-items: center;
}

.fixed-footer-action-left {
  justify-content: flex-start;
}

.fixed-footer-action-right {
  justify-content: flex-end;
}

.fixed-footer-action :deep(.ant-btn) {
  min-width: 54px;
}

.fixed-footer-action-spaced :deep(.ant-btn > span) {
  display: inline-block;
  letter-spacing: 0.5em;
  margin-right: -0.5em;
}
</style>
